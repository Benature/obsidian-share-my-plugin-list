import { Editor, MarkdownView, Notice, ObsidianProtocolData, Plugin, PluginManifest, TFile, normalizePath, requestUrl } from 'obsidian';
import { PluginSettings, DEFAULT_SETTINGS, ShareMyPluginSettingTab as ShareMyPluginSettingTab } from "src/setting/setting";
import { Locals } from "./src/i18n/i18n";
import { addTimestampToFilePath, processFunding, touchFolder } from "./src/utils"
import PluginInstaller from 'src/installer';
import { getPluginManager } from "src/obsidian-internals";
import type { PluginMap, SharePluginManifest } from "src/obsidian-internals";

export default class ShareMyPlugin extends Plugin {
	settings: PluginSettings;
	installer: PluginInstaller;

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, (await this.loadData()) as Partial<PluginSettings>);
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}

	onload(): void {
		void this.initialize();
	}

	private async initialize(): Promise<void> {
		const t = Locals.get();
		await this.loadSettings();
		this.addSettingTab(new ShareMyPluginSettingTab(this.app, this));
		this.installer = new PluginInstaller(this);


		this.addCommand({
			id: 'generate-list-of-active-plugins',
			name: t.command.GenerateActiveList,
			editorCallback: async (editor: Editor, view: MarkdownView) => {
				const plugins = await this.getActivePlugins();
				editor.replaceSelection(this.genList(plugins));
			}
		});
		this.addCommand({
			id: 'generate-table-of-active-plugins',
			name: t.command.GenerateActiveTable,
			editorCallback: async (editor: Editor, view: MarkdownView) => {
				const plugins = await this.getActivePlugins();
				editor.replaceSelection(this.genTable(plugins));
			}
		});
		this.addCommand({
			id: 'generate-list-of-inactive-plugins',
			name: t.command.GenerateInactiveList,
			editorCallback: async (editor: Editor, view: MarkdownView) => {
				const plugins = await this.getInactivePlugins();
				editor.replaceSelection(this.genList(plugins));
			}
		});
		this.addCommand({
			id: 'generate-table-of-inactive-plugins',
			name: t.command.GenerateInactiveTable,
			editorCallback: async (editor: Editor, view: MarkdownView) => {
				const plugins = await this.getInactivePlugins();
				editor.replaceSelection(this.genTable(plugins));
			}
		});
		this.addCommand({
			id: 'export-file',
			name: t.command.ExportFile,
			callback: async () => {
				await this.exportToFile();
			}
		});

		this.addCommand({
			id: 'install-all',
			name: t.command.InstallAllInFill,
			editorCallback: async (editor: Editor, view: MarkdownView) => {
				const text = editor.getValue();
				const urls: Set<string> = new Set();
				text.match(/obsidian:\/\/SP-install\?[^\s\])]+/g)?.forEach(url => {
					urls.add(url);
				})
				for (const urlString of urls) {
					const url = new URL(urlString);
					const params: ObsidianProtocolData = { action: url.pathname.replace(/^\/+/g, "") };
					for (const k of url.searchParams.keys()) {
						params[k] = url.searchParams.get(k) ?? "";
					}
					await this.installer.parseAndInstallPlugin(params);
				}
			}
		});

		this.registerObsidianProtocolHandler("SP-install", async (params: ObsidianProtocolData) => {
			await this.installer.parseAndInstallPlugin(params);
		})

		if (this.settings.exportFileWhenLoaded) {
			window.setTimeout(() => {
				void this.exportToFile(false);
			}, 1000);
		}

	}

	async exportToFile(open = true) {
		let content: string;
		const plugins = await this.getActivePlugins();
		switch (this.settings.exportFileFormat) {
			case "list":
				content = this.genList(plugins);
				break;
			case "table":
				content = this.genTable(plugins);
				break;
			default:
				new Notice(`Unknown export file format: ${this.settings.exportFileFormat}`);
				return;
		}

		const commentPrefix = "<!-- ShareMyPlugin begin -->";
		const commentSuffix = "<!-- ShareMyPlugin end -->";
		content = commentPrefix + "\n\n" + content + "\n\n" + commentSuffix;

		const vault = this.app.vault;
		const configuredPath = normalizePath(this.settings.exportFilePath);
		const path = this.settings.exportFileNameTimestamp ? addTimestampToFilePath(configuredPath) : configuredPath;
		await touchFolder(vault, path.split(/[/\\]/).slice(0, -1).join("/"));
		if (await vault.adapter.exists(path)) {
			const contentOriginal = await vault.adapter.read(path);
			const r = RegExp(commentPrefix + String.raw`[\s\S]*?` + commentSuffix, "m");
			const contentNew = r.test(contentOriginal) ? contentOriginal.replace(r, content) : content;
			await vault.adapter.write(path, contentNew);
		} else {
			await vault.create(path, content);
		}

		new Notice(`Exported plugin ${this.settings.exportFileFormat} to ${path}.`);

		if (open && this.settings.exportFileOpen) {
			const file = vault.getAbstractFileByPath(path);
			if (file instanceof TFile) {
				const leaf = this.app.workspace.getLeaf(this.settings.exportFileNewLeaf);
				await leaf.openFile(file);
			}
		}
	}

	getOrderedPluginKeys(plugins: PluginMap): string[] {
		const keys = Object.keys(plugins);
		if (this.settings.pluginSortOrder !== "off") {
			const direction = this.settings.pluginSortOrder === "desc" ? -1 : 1;
			keys.sort((a, b) => {
				const nameA = plugins[a].manifest.name ?? a;
				const nameB = plugins[b].manifest.name ?? b;
				const comparison = nameA.localeCompare(nameB, undefined, { sensitivity: "base" }) || a.localeCompare(b);
				return comparison * direction;
			});
		}
		return keys;
	}

	genList(plugins: PluginMap): string {
		// const plugins = this.getActivePlugins();
		const text: string[] = [];
		for (const key of this.getOrderedPluginKeys(plugins)) {
			const m = plugins[key].manifest;
			let line = `- [⬇️](${m.installLink}) [**${m.name}**](${m.pluginUrl})`
			if (m.author && m.authorUrl) {
				line += ` by [*${m.author2}*](${m.authorUrl})`
			}
			line += processFunding(m);
			if (this.settings.descriptionLength >= 0) {
				line += ` ^[${m?.description}]`
			}
			text.push(line);
		}
		return text.join('\n') + "\n\n";
	}

	genTable(plugins: PluginMap): string {
		// const plugins = this.getActivePlugins();
		const t = Locals.get();
		const hasDesc = this.settings.descriptionLength >= 0;

		const text: string[] = [""];
		text.push(t.genTableTemplate.Heading + (hasDesc ? t.genTableTemplate.headerDescription : ""));
		text.push(t.genTableTemplate.Align + (hasDesc ? "---|" : ""));

		for (const key of this.getOrderedPluginKeys(plugins)) {
			const m = plugins[key].manifest;
			const name = `[**${m.name}**](${m.pluginUrl}) [⬇️](${m.installLink})`
			let author = "";
			if (m.author && m.authorUrl) {
				author = `[${m?.author2}](${m?.authorUrl})`
			}
			author += processFunding(m);

			let line = `|${name}|${author}|${m?.version}|`;
			if (hasDesc) {
				let description = m?.description;
				if (this.settings.descriptionLength > 0 && description.length > this.settings.descriptionLength) {
					description = description.slice(0, this.settings.descriptionLength).replace(/ +.{1,8}$/, "");
					description += "...";
				}
				line += `${description}|`;
			}
			text.push(line);
		}
		return text.join('\n') + "\n";
	}

	async getActivePlugins() {
		const originPlugins = getPluginManager(this.app).plugins;
		return await this.processPlugins(originPlugins);
	}

	async getInactivePlugins() {
		const appPlugins = getPluginManager(this.app);
		const activePlugins = appPlugins.plugins;

		// const vault = this.app.vault
		// @ts-ignore
		// const basePath = vault.adapter.basePath;
		// const pluginPath = normalizePath(basePath + "/" + vault.configDir + "/plugins");

		// const pluginsArray: { [key: string]: any } = {};

		// all plugins (enable & disable)
		const allPluginManifests: Record<string, SharePluginManifest> = appPlugins.manifests;
		const inactivePluginManifests: PluginMap = {};
		for (const id in allPluginManifests) {
			if (id in activePlugins) { continue; }
			inactivePluginManifests[id] = {
				manifest: allPluginManifests[id],
				disabled: true,
			}
		}
		// const inactivePluginManifests = allPluginManifests.filter(
		// 	(p: { [key: string]: any }) => Object.keys(activePlugins).includes(p.id));
		return inactivePluginManifests;

		// const pluginFolderNames: Promise<string[]> = new Promise((resolve, reject) => {
		// 	fs.readdir(pluginPath, (err, files) => {
		// 		if (err) {
		// 			reject(err);
		// 		} else {
		// 			resolve(files);
		// 		}
		// 	});
		// });
		// for (let folderName of await pluginFolderNames) {
		// 	if (!activePluginFolderName.includes(folderName)) {
		// 		// @ts-ignore
		// 		const { plugins } = this.app;
		// 		const manifestPath = normalizePath(basePath + "/" + plugins.getPluginFolder() + "/" + folderName + "/manifest.json");
		// 		if (fs.existsSync(manifestPath)) {
		// 			const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf-8"));
		// 			pluginsArray[manifest.id] = { manifest: manifest };
		// 		}
		// 	}
		// }
		// return await this.processPlugins(pluginsArray);
	}

	async processPlugins(originPlugins: PluginMap): Promise<PluginMap> {
		const plugins: PluginMap = {};
		for (const name in originPlugins) {
			try {
				const plugin = { ...originPlugins[name] }; // new an object and make it extensible
				plugin.manifest = { ...originPlugins[name].manifest }
				plugin.manifest["pluginUrl"] = `https://obsidian.md/plugins?id=${plugin.manifest.id}`;
				plugin.manifest["author2"] = plugin.manifest.author?.replace(/<.*?@.*?\..*?>/g, "").trim(); // remove email address
				plugin.manifest["installLink"] = `obsidian://SP-install?id=${plugin.manifest.id}&enable=true`;
				plugins[name] = plugin;
			} catch (e) {
				console.error(name, e);
			}
		}
		if ("obsidian42-brat" in plugins == false) {
			return plugins;
		}
		const BRAT = plugins["obsidian42-brat"];
		const communityPlugins = this.installer.communityPlugins ?? {};
		for (const repo of BRAT.settings?.pluginList ?? []) {
			let manifest: { id: string };
			try {
				const response = await requestUrl(`https://raw.githubusercontent.com/${repo}/HEAD/manifest.json`);
				manifest = response.json as PluginManifest;
			} catch (e) {
				console.warn(`Share My Plugin List: failed to fetch BRAT manifest for ${repo}; using the default plugin metadata.`, e);
				continue;
			}
			if (!(manifest.id in communityPlugins) && (manifest.id in originPlugins)) {
				plugins[manifest.id].manifest.pluginUrl = `https://github.com/${repo}`;
				plugins[manifest.id].manifest["installLink"] = `obsidian://SP-install?id=${plugins[manifest.id].manifest.id}&enable=true&github=${repo}`;
			}
		}
		return plugins;
	}

	onunload() {
	}
}
