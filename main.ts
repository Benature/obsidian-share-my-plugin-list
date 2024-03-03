import { App, Editor, MarkdownView, Modal, Notice, Plugin, PluginSettingTab, Setting } from 'obsidian';
import { PluginSettings, DEFAULT_SETTINGS, ShareMyPluginSettingTab as ShareMyPluginSettingTab } from "src/setting/setting";
import { Locals } from "./src/i18n/i18n";

export default class ShareMyPlugin extends Plugin {
	settings: PluginSettings;

	async onload() {
		const t = Locals.get();
		await this.loadSettings();
		this.addSettingTab(new ShareMyPluginSettingTab(this.app, this));

		this.addCommand({
			id: 'generate-list',
			name: t.command.GenerateList,
			editorCallback: (editor: Editor, view: MarkdownView) => {
				editor.replaceSelection(this.genList());
			}
		});
		this.addCommand({
			id: 'generate-table',
			name: t.command.GenerateTable,
			editorCallback: (editor: Editor, view: MarkdownView) => {
				editor.replaceSelection(this.genTable());
			}
		});
		this.addCommand({
			id: 'export-file',
			name: t.command.ExportFile,
			callback: async () => {
				let content: string;
				switch (this.settings.exportFileFormat) {
					case "list":
						content = this.genList();
						break;
					case "table":
						content = this.genTable();
						break;
					default:
						new Notice(`Unknow export file format: ${this.settings.exportFileFormat}`);
						return;
				}

				const vault = this.app.vault;
				const path = this.settings.exportFilePath;
				await this.touchFolder(vault, path.split(/[\/\\]/).slice(0, -1).join("/"));
				if (await vault.adapter.exists(path)) { await vault.adapter.remove(path) }
				await vault.create(path, content);
				new Notice(`Exported plugin ${this.settings.exportFileFormat} to ${path}.`);

			}
		});
	}

	async touchFolder(vault: any, folder: string) {
		console.log(`touching ${folder}`);
		if (await vault.adapter.exists(folder)) {
			return;
		}
		const folders = folder.split(/[\/\\]/);
		if (folders.length > 1) {
			await this.touchFolder(vault, folders.slice(0, -1).join("/"));
		}
		await vault.adapter.mkdir(folder);
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}

	genList(): string {
		const plugins = this.getPlugins();

		let text: string[] = [];
		for (let key in plugins) {
			if (this.settings.debugMode) { console.log(plugins[key]); }
			const m = plugins[key].manifest;
			let line = `- [**${m.name}**](${m.pluginUrl})`
			if (m.author && m.authorUrl) {
				line += ` by [*${m.author2}*](${m.authorUrl})`
			}
			line += processFunding(m);
			text.push(line);
		}
		return text.join('\n') + "\n";

	}

	genTable(): string {
		const plugins = this.getPlugins();
		const t = Locals.get();

		let text: string[] = [""];
		text.push(t.genTableTemplate.Heading);
		text.push(t.genTableTemplate.Align);

		for (let key in plugins) {
			if (this.settings.debugMode) { console.log(plugins[key]); }
			const m = plugins[key].manifest;
			let name = `[**${m.name}**](${m.pluginUrl})`
			let author = "";
			if (m.author && m.authorUrl) {
				author = `[${m?.author2}](${m?.authorUrl})`
			}
			author += processFunding(m);
			text.push(`|${name}|${author}|${m?.version}|`);
		}
		return text.join('\n') + "\n";
	}

	getPlugins() {
		// @ts-ignore
		const originPlugins = this.app.plugins.plugins;
		let plugins: any = {};
		for (let name in originPlugins) {
			try {
				let plugin = originPlugins[name];
				if (this.settings.debugMode) { console.log(plugin); }
				plugin.manifest.pluginUrl = `https://obsidian.md/plugins?id=${plugin.manifest.id}`;
				plugin.manifest["author2"] = plugin.manifest.author.replace(/<.*?@.*?\..*?>/g, "").trim(); // remove email address
				plugins[name] = plugin;
			} catch (e) {
				console.log(e)
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

	onunload() {
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
