import { App, Editor, MarkdownView, Modal, Notice, Plugin, PluginSettingTab, Setting } from 'obsidian';

export default class ShareMyPluginList extends Plugin {

	async onload() {
		let lang = window.localStorage.getItem('language');
		if (lang == null || ["en", "zh", "zh-TW"].indexOf(lang) == -1) { lang = "en"; }

		this.addCommand({
			id: 'generate-list',
			name: { en: 'Generate List', 'zh': '生成插件列表', 'zh-TW': '產生插件清單' }[lang] as string,
			editorCallback: (editor: Editor, view: MarkdownView) => {
				this.genList(editor);
			}
		});
		this.addCommand({
			id: 'generate-table',
			name: { en: 'Generate Table', zh: '生成插件表格', 'zh-TW': '產生插件表格' }[lang] as string,
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
			let line = `- [**${m.name}**](https://obsidian.md/plugins?id=${m.id})`
			if (m.author && m.authorUrl) {
				line += `by [*${m.author}*](${m.authorUrl})`
			}
			text.push(line);
		}
		editor.replaceSelection(text.join('\n') + "\n");
	}

	async genTable(editor: Editor) {
		const plugins = this.getPlugins();

		let text: string[] = [""];
		text.push("|Plugin|Author|Version|");
		text.push("|------|------|------|");
		for (let key in plugins) {
			const m = plugins[key].manifest;
			let name = `[**${m.name}**](https://obsidian.md/plugins?id=${m.id})`
			let author = "";
			if (m.author && m.authorUrl) {
				author = `[${m?.author.replace(/<.*?@.*?\..*?>/g, "")}](${m?.authorUrl})`
			}
			text.push(`|${name}|${author}|${m?.version}|`);
		}
		editor.replaceSelection(text.join('\n') + "\n");
	}

	getPlugins() {
		// @ts-ignore
		return this.app.plugins.plugins;
	}

	onunload() {
	}
}
