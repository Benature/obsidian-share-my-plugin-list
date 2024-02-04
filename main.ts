import { App, Editor, MarkdownView, Modal, Notice, Plugin, PluginSettingTab, Setting } from 'obsidian';

export default class ShareMyPluginList extends Plugin {

	async onload() {
		let lang = window.localStorage.getItem('language');
		if (lang == null || ["en", "zh", "zh-TW"].indexOf(lang) == -1) { lang = "en"; }

		this.addCommand({
			id: 'generate-list',
			name: { en: 'Export as List', 'zh': '列表形式导出插件名单', 'zh-TW': '清單形式匯出插件名單' }[lang] as string,
			editorCallback: (editor: Editor, view: MarkdownView) => {
				this.genList(editor);
			}
		});
		this.addCommand({
			id: 'generate-table',
			name: { en: 'Export as Table', zh: '表格形式导出插件名单', 'zh-TW': '表格形式匯出插件名單' }[lang] as string,
			editorCallback: (editor: Editor, view: MarkdownView) => {
				this.genTable(editor);
			}
		});
	}

	async genList(editor: Editor) {
		const plugins = this.getPlugins();

		let text: string[] = [];
		for (let key in plugins) {
			const m = plugins[key].manifest;
			let line = `- [**${m.name}**](${m.pluginUrl})`
			if (m.author && m.authorUrl) {
				line += ` by [*${m.author2}*](${m.authorUrl})`
			}
			line += processFunding(m);
			text.push(line);
		}
		editor.replaceSelection(text.join('\n') + "\n");
	}

	async genTable(editor: Editor) {
		const plugins = this.getPlugins();
		const lang = window.localStorage.getItem('language');

		let text: string[] = [""];
		switch (lang) {
			case "zh":
				text.push("|插件名|作者|版本|");
				text.push("|-----|---|----|");
				break;
			case "zh-TW":
				text.push("|插件名|作者|版本|");
				text.push("|-----|---|----|");
				break;
			default:
				text.push("|Name|Author|Version|");
				text.push("|----|------|-------|");
				break;
		}
		for (let key in plugins) {
			const m = plugins[key].manifest;
			let name = `[**${m.name}**](${m.pluginUrl})`
			let author = "";
			if (m.author && m.authorUrl) {
				author = `[${m?.author2}](${m?.authorUrl})`
			}
			author += processFunding(m);
			text.push(`|${name}|${author}|${m?.version}|`);
		}
		editor.replaceSelection(text.join('\n') + "\n");
	}

	getPlugins() {
		// @ts-ignore
		let plugins = this.app.plugins.plugins;
		for (let name in plugins) {
			plugins[name].manifest.pluginUrl = `https://obsidian.md/plugins?id=${plugins[name].manifest.id}`;
			plugins[name].manifest["author2"] = plugins[name].manifest.author.replace(/<.*?@.*?\..*?>/g, "").trim();
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
			info += ` [♡](${m.fundingUrl})`
		} else if (typeof (m.fundingUrl) == 'object') {
			for (let key in m.fundingUrl) {
				console.log(key)
				info += ` [♡](${m.fundingUrl[key]})`
			}
		}
	}
	return info;
}
