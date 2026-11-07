import { Setting, PluginSettingTab, App, ButtonComponent, Notice } from "obsidian";
import ShareMyPlugin from "../../main";

import { FileSuggest } from "./suggester/FileSuggest";
import { addFundingElement } from "./funding";


export type PluginSortOrder = "off" | "asc" | "desc";

export interface PluginSettings {
	exportFilePath: string,
	exportFileNameTimestamp: boolean,
	pluginSortOrder: PluginSortOrder,
	exportFileFormat: string,
	exportFileOpen: boolean,
	exportFileNewLeaf: boolean,
	exportFileWhenLoaded: boolean,
	debugMode: boolean,
	descriptionLength: number
}

export const DEFAULT_SETTINGS: PluginSettings = {
	exportFilePath: "ShareMyPlugin.md",
	exportFileNameTimestamp: false,
	pluginSortOrder: "off",
	exportFileFormat: "list",
	exportFileOpen: true,
	exportFileNewLeaf: true,
	exportFileWhenLoaded: false,
	debugMode: false,
	descriptionLength: 50,
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
		new Setting(this.containerEl)
			.setName("Max length of description")
			.setDesc("-1: do not output description. 0: output description no matter how long it is. >0: output description up to the specified length.")
			.addText((cb) => {
				const parseLength = (value: string): number | null => {
					if (value.trim() === "") return null;
					const parsed = Number(value);
					return Number.isFinite(parsed) ? parsed : null;
				};
				cb.setPlaceholder("length")
					.setValue(this.plugin.settings.descriptionLength.toString())
					.onChange(async (newValue) => {
						const value = parseLength(newValue);
						if (value !== null) {
							this.plugin.settings.descriptionLength = value;
							await this.plugin.saveSettings();
						}
					});
				cb.inputEl.addEventListener("blur", () => {
					if (parseLength(cb.inputEl.value) === null) {
						new Notice(`The length must be a number!`);
						cb.setValue(this.plugin.settings.descriptionLength.toString());
					}
				});
			});

		new Setting(containerEl)
			.setName("Sort plugins by name")
			.setDesc("Sort all list and table outputs by plugin name in case-insensitive order, or preserve the original order.")
			.addDropdown((dropdown) => {
				dropdown
					.addOption("off", "Original order")
					.addOption("asc", "Ascending (A-Z)")
					.addOption("desc", "Descending (Z-A)")
					.setValue(this.plugin.settings.pluginSortOrder)
					.onChange(async (value) => {
						this.plugin.settings.pluginSortOrder = value as PluginSortOrder;
						await this.plugin.saveSettings();
					});
			});

		containerEl.createEl("h2", { text: "Export to file" });
		new Setting(this.containerEl)
			.setName("Path of file to export")
			.setDesc("IMPORTANT: Without a filename timestamp, this file will be overwritten by the plugin, i.e., old content would be deleted.")
			.addText((cb) => {
				new FileSuggest(this.app, cb.inputEl);
				cb.setPlaceholder("output/ShareMyPlugin.md")
					.setValue(this.plugin.settings.exportFilePath)
					.onChange(async (newValue) => {
						this.plugin.settings.exportFilePath = newValue;
						await this.plugin.saveSettings();
					});
			});

		new Setting(containerEl)
			.setName("Add timestamp to filename")
			.setDesc("Prefix the filename with the local time in YYYY-MM-DD_HH-mm format, e.g. 2024-04-26_20-26-ShareMyPlugin.md.")
			.addToggle((toggle) => {
				toggle
					.setValue(this.plugin.settings.exportFileNameTimestamp)
					.onChange(async (value) => {
						this.plugin.settings.exportFileNameTimestamp = value;
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

		new Setting(containerEl)
			.setName("Open file after export")
			.setDesc("Open the exported file after export.")
			.addToggle((toggle) => {
				toggle
					.setValue(this.plugin.settings.exportFileOpen)
					.onChange(async (value) => {
						this.plugin.settings.exportFileOpen = value;
						await this.plugin.saveSettings();
						this.display();
					});
			});
		if (this.plugin.settings.exportFileOpen) {
			new Setting(containerEl)
				.setName("Open in new tab")
				.setDesc("Open the exported file in a new tab (leaf).")
				.addToggle((toggle) => {
					toggle
						.setValue(this.plugin.settings.exportFileNewLeaf)
						.onChange(async (value) => {
							this.plugin.settings.exportFileNewLeaf = value;
							await this.plugin.saveSettings();
						});
				});
		}
		new Setting(containerEl)
			.setName("Export file once Obsidian is started.")
			.setDesc("Automatically update each time Obsidian is started")
			.addToggle((toggle) => {
				toggle
					.setValue(this.plugin.settings.exportFileWhenLoaded)
					.onChange(async (value) => {
						this.plugin.settings.exportFileWhenLoaded = value;
						await this.plugin.saveSettings();
						this.display();
					});
			});

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

