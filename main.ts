import { App, Editor, MarkdownView, Modal, Notice, Plugin, PluginSettingTab, Setting } from 'obsidian';

// Remember to rename these classes and interfaces!


export default class ShareMyPluginList extends Plugin {

	async onload() {
		this.addCommand({
			id: 'generate-list',
			name: 'Generate List',
			editorCallback: (editor: Editor, view: MarkdownView) => {
				this.getPluginList(editor);
			}
		});
	}

	async getPluginList(editor: Editor) {
		const vault = this.app.vault;
		const json_path = `${vault.configDir}/community-plugins.json`
		if (!(await vault.adapter.exists(json_path))) {
			return;
		}
		const plugins = JSON.parse(await vault.adapter.read(json_path));

		let text: string[] = [];
		plugins.forEach((p: string, i: number) => {
			text.push(`- [${p}](https://obsidian.md/plugins?id=${p})`);
		})
		editor.replaceSelection(text.join('\n') + "\n");
	}

	onunload() {
	}
}
