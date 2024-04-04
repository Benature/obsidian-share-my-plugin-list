import { App, Editor, MarkdownView, Modal, Notice, ObsidianProtocolData, Plugin, normalizePath } from 'obsidian';
import { PluginSettings, DEFAULT_SETTINGS, ShareMyPluginSettingTab as ShareMyPluginSettingTab } from "src/setting/setting";
import * as fs from 'fs';
import { Locals } from "./src/i18n/i18n";
import { processFunding, touchFolder } from "./src/utils"
import PluginInstaller from 'src/installer';

export default class ShareMyPlugin extends Plugin {
	settings: PluginSettings;
	installer: PluginInstaller;

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}

	async onload() {

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
				let text = editor.getValue();
				const urls: Set<string> = new Set();
				text.match(/obsidian:\/\/SP-install\?[^\s\]\)]+/g)?.forEach(url => {
					urls.add(url);
				})
				for (const urlString of urls) {
					const url = new URL(urlString);
					let params: ObsidianProtocolData = { action: url.pathname.replace(/^\/+/g, "") };
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
			setTimeout(async () => {
				await this.exportToFile(false);
			}, 1000);
		}

		this.getInactivePlugins();
	}

	debug(...args: any[]): void {
		if (this.settings.debugMode) {
			console.log(...args);
		}
	}

	async exportToFile(open = true) {
		this.debug("exportToFile")
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
		this.debug(content)

		const vault = this.app.vault;
		const path = this.settings.exportFilePath;
		await touchFolder(vault, path.split(/[\/\\]/).slice(0, -1).join("/"));
		if (await vault.adapter.exists(path)) {
			let contentOriginal = await vault.adapter.read(path);
			this.debug("contentOriginal", contentOriginal)
			const r = RegExp(commentPrefix + String.raw`[\s\S]*?` + commentSuffix, "m");
			let contentNew = r.test(contentOriginal) ? contentOriginal.replace(r, content) : content;
			await vault.adapter.write(path, contentNew);
		} else {
			await vault.create(path, content);
		}

		new Notice(`Exported plugin ${this.settings.exportFileFormat} to ${path}.`);

		if (open && this.settings.exportFileOpen) {
			this.app.workspace.openLinkText(path, path, this.settings.exportFileNewLeaf);
		}
	}

	genList(plugins: any): string {
		this.debug("genList");
		// const plugins = this.getActivePlugins();
		this.debug(plugins)
		let text: string[] = [];
		for (let key in plugins) {
			// this.debug(key)
			const m = plugins[key].manifest;
			this.debug(m)
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
		this.debug(text);
		return text.join('\n') + "\n\n";
	}

	genTable(plugins: any): string {
		this.debug("genTable")
		// const plugins = this.getActivePlugins();
		const t = Locals.get();
		const hasDesc = this.settings.descriptionLength >= 0;

		let text: string[] = [""];
		text.push(t.genTableTemplate.Heading + (hasDesc ? t.genTableTemplate.headerDescription : ""));
		text.push(t.genTableTemplate.Align + (hasDesc ? "---|" : ""));

		for (let key in plugins) {
			this.debug(plugins[key]);
			const m = plugins[key].manifest;
			let name = `[**${m.name}**](${m.pluginUrl}) [⬇️](${m.installLink})`
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
		this.debug(text)
		return text.join('\n') + "\n";
	}

	async getActivePlugins() {
		this.debug("getActivePlugins");
		// @ts-ignore
		const originPlugins = this.app.plugins.plugins;
		return await this.processPlugins(originPlugins);
	}

	async getInactivePlugins() {
		this.debug("getInactivePlugins");
		// @ts-ignore
		const appPlugins = this.app.plugins;
		const activePlugins = appPlugins.plugins;
		const activePluginFolderName: string[] = [];
		for (let n in activePlugins) {
			activePluginFolderName.push(activePlugins[n].manifest.dir.split(/[\/\\]/)[2]);
		}
		this.debug(activePluginFolderName)

		// const vault = this.app.vault
		// @ts-ignore
		// const basePath = vault.adapter.basePath;
		// const pluginPath = normalizePath(basePath + "/" + vault.configDir + "/plugins");

		// const pluginsArray: { [key: string]: any } = {};

		// all plugins (enable & disable)
		const allPluginManifests = appPlugins.manifests;
		const inactivePluginManifests: { [key: string]: any } = {};
		for (const id in allPluginManifests) {
			if (id in activePlugins) { continue; }
			inactivePluginManifests[id] = {
				manifest: allPluginManifests[id],
				disabled: true,
			}
		}
		// const inactivePluginManifests = allPluginManifests.filter(
		// 	(p: { [key: string]: any }) => Object.keys(activePlugins).includes(p.id));
		// console.log(inactivePluginManifests)
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

	async processPlugins(originPlugins: any) {
		let plugins: any = {};
		for (let name in originPlugins) {
			try {
				let plugin = { ...originPlugins[name] }; // new an object and make it extensible
				plugin.manifest = { ...originPlugins[name].manifest }
				plugin.manifest["pluginUrl"] = `https://obsidian.md/plugins?id=${plugin.manifest.id}`;
				plugin.manifest["author2"] = plugin.manifest.author?.replace(/<.*?@.*?\..*?>/g, "").trim(); // remove email address
				plugin.manifest["installLink"] = `obsidian://SP-install?id=${plugin.manifest.id}&enable=true`;
				plugins[name] = plugin;
			} catch (e) {
				console.error(name, e);
				console.log(originPlugins[name]);
				console.log(originPlugins[name].manifest);
				console.log(typeof originPlugins[name].manifest);
			}
		}
		if ("obsidian42-brat" in plugins == false) {
			return plugins;
		}
		const BRAT = plugins["obsidian42-brat"];
		for (let repo of BRAT.settings.pluginList) {
			const manifest = await fetch(`https://raw.githubusercontent.com/${repo}/HEAD/manifest.json`).then(r => r.json());
			if (!(manifest.id in this.installer.communityPlugins)) {
				plugins[manifest.id].manifest.pluginUrl = `https://github.com/${repo}`;
				plugins[manifest.id].manifest["installLink"] = `obsidian://SP-install?id=${plugins[manifest.id].manifest.id}&enable=true&github=${repo}`;
			}
		}
		return plugins;
	}

	onunload() {
	}
}
