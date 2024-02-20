import { Setting, PluginSettingTab, App, ButtonComponent } from "obsidian";
import ShareMyPlugin from "../../main";

import { FileSuggest } from "./suggester/FileSuggest";
import { addFundingElement } from "./funding";


export interface PluginSettings {
	exportFilePath: string,
	exportFileFormat: string,
	debugMode: boolean,
}

export const DEFAULT_SETTINGS: PluginSettings = {
	exportFilePath: "ShareMyPlugin.md",
	exportFileFormat: "list",
	debugMode: false,
};

export class ShareMyPluginSettingTab extends PluginSettingTab {
	plugin: ShareMyPlugin;

	constructor(app: App, plugin: ShareMyPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		let { containerEl } = this;

		containerEl.empty();

		containerEl.createEl("h2", { text: "Export to file" });
		new Setting(this.containerEl)
			.setName("Path of file to export")
			.setDesc("")
			.addSearch((cb) => {
				new FileSuggest(this.app, cb.inputEl);
				cb.setPlaceholder("output/ShareMyPlugin.md")
					.setValue(this.plugin.settings.exportFilePath)
					.onChange(async (newValue) => {
						this.plugin.settings.exportFilePath = newValue;
						await this.plugin.saveSettings();
					});
			});

		new Setting(containerEl)
			.setName('Export format')
			.setDesc('')
			.addDropdown(dropDown =>
				dropDown
					.addOption('list', 'List')
					.addOption('table', 'Table')
					.setValue(this.plugin.settings.exportFileFormat || 'list')
					.onChange((value: string) => {
						this.plugin.settings.exportFileFormat = value;
						this.plugin.saveSettings();
					}));

		containerEl.createEl("h2", { text: "Advance settings" });
		new Setting(containerEl)
			.setName("Debug mode")
			.setDesc("verbose log in the console")
			.addToggle((toggle) => {
				toggle
					.setValue(this.plugin.settings.debugMode)
					.onChange(async (value) => {
						this.plugin.settings.debugMode = value;
						await this.plugin.saveSettings();
					});
			});


		addFundingElement(containerEl);
	}
}

