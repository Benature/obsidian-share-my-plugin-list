import ShareMyPlugin from "main";
import { Notice, ObsidianProtocolData, PluginManifest, debounce, requestUrl } from "obsidian";
import { getPluginManager } from "./obsidian-internals";

interface CommunityPlugin {
	id: string;
	repo: string;
}

export default class PluginInstaller {
	plugin: ShareMyPlugin;
	communityPlugins: Record<string, CommunityPlugin> = {};
	loaded = false;
	debounceFetch = debounce(() => { void this.fetchCommunityPlugins(); }, 1000 * 60 * 60);

	async fetchCommunityPlugins(): Promise<void> {
		const response = await requestUrl("https://raw.githubusercontent.com/obsidianmd/obsidian-releases/master/community-plugins.json");
		const pluginList = response.json as CommunityPlugin[];
		this.communityPlugins = Object.fromEntries(pluginList.map(item => [item.id, item]));
		this.loaded = true;
	}

	constructor(plugin: ShareMyPlugin) {
		this.plugin = plugin;
		void this.fetchCommunityPlugins();
	}

	/**
	 * @param id Plugin ID to install.
	 * @param version Version to install; an empty string uses the manifest version.
	 * @param enable Whether to enable the plugin after installation.
	 * @param github Optional GitHub repository in owner/name form.
	 */
	public async installPlugin(id: string, version = "", enable = false, github = ""): Promise<void> {
		if (!this.loaded) {
			await this.fetchCommunityPlugins();
		} else {
			this.debounceFetch();
		}
		const pluginRegistry = getPluginManager(this.plugin.app);

		let installFlag = false;
		const repo = github !== "" ? github : this.communityPlugins[id]?.repo;
		if (!repo) {
			new Notice(`Unknown plugin id: ${id}`);
			return;
		}

		if (pluginRegistry.manifests[id]) {
			new Notice(`Plugin ${pluginRegistry.manifests[id].name} already installed.`);
			if (version !== "" && version !== pluginRegistry.manifests[id]?.version) {
				installFlag = true;
			}
		} else {
			installFlag = true;
		}

		if (installFlag) {
			const response = await requestUrl(`https://raw.githubusercontent.com/${repo}/HEAD/manifest.json`);
			const manifest = response.json as PluginManifest;
			if (version.toLowerCase() === "latest" || version === "") version = manifest.version;
			await pluginRegistry.installPlugin(repo, version, manifest);
		}

		if (enable) {
			await pluginRegistry.loadPlugin(id);
			await pluginRegistry.enablePluginAndSave(id);
		} else {
			await pluginRegistry.disablePlugin(id);
		}
	}

	public async parseAndInstallPlugin(params: ObsidianProtocolData): Promise<void> {
		const args = {
			id: params.id,
			version: params?.version ?? "",
			enable: ["", "true", "1"].includes(params.enable.toLowerCase()),
			github: params.github ?? "",
		};
		await this.installPlugin(args.id, args.version, args.enable, args.github);
	}
}
