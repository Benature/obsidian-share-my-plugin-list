import { App, Editor, MarkdownView, Modal, Notice, Plugin, PluginSettingTab, Setting } from 'obsidian';

// Remember to rename these classes and interfaces!


export default class ShareMyPluginList extends Plugin {

	async onload() {
		this.addCommand({
			id: 'generate-list',
			name: 'Generate List',
			editorCallback: (editor: Editor, view: MarkdownView) => {
				this.genList(editor);
			}
		});
		this.addCommand({
			id: 'generate-table',
			name: 'Generate Table',
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
			console.log(m)
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
			console.log(m)
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
