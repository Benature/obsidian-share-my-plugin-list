import ShareMyPlugin from "main";
import { Notice, debounce } from "obsidian";

export let communityPlugins: any;

export default class pluginInstaller {
	plugin: ShareMyPlugin;
	communityPlugins: Record<string, { [key: string]: string }>;
	loaded: boolean;
	debounceFetch = debounce(async () => { await this.fetchCommunityPlugins }, 1000 * 60 * 60); // 1 hour

	async fetchCommunityPlugins() {
		const pluginList = await fetch(`https://raw.githubusercontent.com/obsidianmd/obsidian-releases/master/community-plugins.json`).then(r => r.json());
		const keyedPluginList: Record<string, any> = {};
		for (const item of pluginList) keyedPluginList[item.id] = item;
		this.communityPlugins = keyedPluginList;
		this.loaded = true;
	}

	constructor(SMPL: ShareMyPlugin) {
		this.plugin = SMPL;
		this.loaded = false;
		this.fetchCommunityPlugins();
	}

	/**	
	 * Params
	 * @param id: string - The id of the plugin to install
	 * @param version: string | null - The version of the plugin to install (if null, the latest version will be installed, if "", don't check the version)
	 * @param enable: boolean - Whether to enable the plugin after installing it
	*/
	public async installPlugin(id: string, version: string = "", enable: boolean = false, github: string = "") {
		console.log(`Share My Plugin List: begin installing plugin -- ${id} - ${version} - ${enable} - ${github}`)
		if (!this.loaded) {
			await this.fetchCommunityPlugins();
		} else {
			this.debounceFetch();
		}
		// @ts-ignore
		const pluginRegistry = this.plugin.app.plugins;

		let installFlag = false;
		const repo = github !== "" ? github : this.communityPlugins[id]?.repo;
		if (!repo) {
			new Notice(`Unknown plugin id: ${id}`);
			return;
		}

		if (pluginRegistry.manifests[id]) {
			// Plugin already installed
			new Notice(`Plugin ${pluginRegistry.manifests[id].name} already installed.`)
			if (version !== "" && version !== pluginRegistry.manifests[id]?.version) {
				installFlag = true;
			}
		} else {
			installFlag = true;
		}

		if (installFlag) {
			const manifest = await fetch(`https://raw.githubusercontent.com/${repo}/HEAD/manifest.json`).then(r => r.json());
			if (version.toLowerCase() === "latest" || version === "") version = manifest.version;
			await pluginRegistry.installPlugin(repo, version, manifest);
		}

		if (enable) {
			await pluginRegistry.loadPlugin(id);
			await pluginRegistry.enablePluginAndSave(id);
		}
		else {
			await pluginRegistry.disablePlugin(id);
		}
	}
}
