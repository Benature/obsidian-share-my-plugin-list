import { App, Editor, MarkdownView, Modal, Notice, Plugin, normalizePath } from 'obsidian';
import { PluginSettings, DEFAULT_SETTINGS, ShareMyPluginSettingTab as ShareMyPluginSettingTab } from "src/setting/setting";
import { Locals } from "./src/i18n/i18n";
import * as fs from 'fs';

export default class ShareMyPlugin extends Plugin {
	settings: PluginSettings;

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


		this.addCommand({
			id: 'generate-list-of-active-plugins',
			name: t.command.GenerateActiveList,
			editorCallback: (editor: Editor, view: MarkdownView) => {
				const plugins = this.getActivePlugins();
				editor.replaceSelection(this.genList(plugins));
			}
		});
		this.addCommand({
			id: 'generate-table-of-active-plugins',
			name: t.command.GenerateActiveTable,
			editorCallback: (editor: Editor, view: MarkdownView) => {
				const plugins = this.getActivePlugins();
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
		const plugins = this.getActivePlugins();
		switch (this.settings.exportFileFormat) {
			case "list":
				content = this.genList(plugins);
				break;
			case "table":
				content = this.genTable(plugins);
				break;
			default:
				new Notice(`Unknow export file format: ${this.settings.exportFileFormat}`);
				return;
		}

		const commentPrefix = "<!-- ShareMyPlugin begin -->";
		const commentSuffix = "<!-- ShareMyPlugin end -->";
		content = commentPrefix + "\n\n" + content + "\n\n" + commentSuffix;
		this.debug(content)

		const vault = this.app.vault;
		const path = this.settings.exportFilePath;
		await this.touchFolder(vault, path.split(/[\/\\]/).slice(0, -1).join("/"));
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
			// this.debug(m)
			let line = `- [**${m.name}**](${m.pluginUrl})`
			if (m.author && m.authorUrl) {
				line += ` by [*${m.author2}*](${m.authorUrl})`
			}
			line += processFunding(m);
			text.push(line);
		}
		this.debug(text);
		return text.join('\n') + "\n";
	}

	genTable(plugins: any): string {
		this.debug("genTable")
		// const plugins = this.getActivePlugins();
		const t = Locals.get();

		let text: string[] = [""];
		text.push(t.genTableTemplate.Heading);
		text.push(t.genTableTemplate.Align);

		for (let key in plugins) {
			this.debug(plugins[key]);
			const m = plugins[key].manifest;
			let name = `[**${m.name}**](${m.pluginUrl})`
			let author = "";
			if (m.author && m.authorUrl) {
				author = `[${m?.author2}](${m?.authorUrl})`
			}
			author += processFunding(m);
			text.push(`|${name}|${author}|${m?.version}|`);
		}
		this.debug(text)
		return text.join('\n') + "\n";
	}

	getActivePlugins() {
		this.debug("getActivePlugins");
		// @ts-ignore
		const originPlugins = this.app.plugins.plugins;
		return processPlugins(originPlugins);
	}

	async getInactivePlugins() {
		this.debug("getInactivePlugins");
		// @ts-ignore
		const activePlugins = this.app.plugins.plugins;
		const activePluginFolderName: string[] = [];
		for (let n in activePlugins) {
			activePluginFolderName.push(activePlugins[n].manifest.dir.split(/[\/\\]/)[2]);
		}
		this.debug(activePluginFolderName)

		const vault = this.app.vault
		// @ts-ignore
		const basePath = vault.adapter.basePath;
		const pluginPath = normalizePath(basePath + "/" + vault.configDir + "/plugins");

		const plugins: { [key: string]: any } = {};
		const pluginFolderNames: Promise<string[]> = new Promise((resolve, reject) => {
			fs.readdir(pluginPath, (err, files) => {
				if (err) {
					reject(err);
				} else {
					resolve(files);
				}
			});
		});
		for (let folderName of await pluginFolderNames) {
			if (!activePluginFolderName.includes(folderName)) {
				const manifestPath = normalizePath(basePath + "/" + vault.configDir + "/plugins/" + folderName + "/manifest.json");
				if (fs.existsSync(manifestPath)) {
					const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf-8"));
					plugins[manifest.id] = { manifest: manifest };
				}
			}
		}
		return processPlugins(plugins);
	}

	onunload() {
	}

	async touchFolder(vault: any, folder: string) {
		this.debug(`touchFolder ${folder}`);
		if (await vault.adapter.exists(folder)) {
			return;
		}
		const folders = folder.split(/[\/\\]/);
		if (folders.length > 1) {
			await this.touchFolder(vault, folders.slice(0, -1).join("/"));
		}
		await vault.adapter.mkdir(folder);
	}
}

function processFunding(m: any): string {
	let info: string = "";
	if (m.fundingUrl) {
		if (typeof (m.fundingUrl) == 'string') {
			info += ` [♡](${m.fundingUrl})`;
		} else if (typeof (m.fundingUrl) == 'object') {
			let sep = " "
			for (let key in m.fundingUrl) {
				const url = m.fundingUrl[key]
				let symbol = "♡"
				let domain = /https?:\/\/([\w\.]+)\//g.exec(url);
				if (domain) {
					switch (domain[1]) {
						case "www.buymeacoffee.com":
							symbol = "☕️"; break;
						case "afdian.net":
							symbol = "⚡️"; break;
					}
				}
				info += `${sep}[${symbol}](${url})`;
				sep = "/"
			}
		}
	}
	return info;
}


function processPlugins(originPlugins: any) {
	let plugins: any = {};
	for (let name in originPlugins) {
		try {
			let plugin = originPlugins[name];
			// this.debug(plugin);
			plugin.manifest.pluginUrl = `https://obsidian.md/plugins?id=${plugin.manifest.id}`;
			plugin.manifest["author2"] = plugin.manifest.author?.replace(/<.*?@.*?\..*?>/g, "").trim(); // remove email address
			plugins[name] = plugin;
		} catch (e) {
			console.error(name, e)
		}
	}
	if ("obsidian42-brat" in plugins == false) {
		return plugins;
	}
	const BRAT = plugins["obsidian42-brat"];
	for (let p of BRAT.settings.pluginList) {
		const pSplit = p.split("/");
		let githubAuthor: string = pSplit[0], name: string = pSplit[1];
		let find = false;
		if (name.toLowerCase() in plugins) {
			find = true;
		} else {
			name = name.toLowerCase().replace(/^obsidian-?/g, "");
			if (name in plugins) { find = true; }
		}

		if (find) {
			plugins[name].manifest.pluginUrl = `https://github.com/${p}`;
		}
	}
	return plugins;
}
