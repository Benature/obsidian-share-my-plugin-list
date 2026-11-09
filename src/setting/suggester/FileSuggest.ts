import { AbstractInputSuggest, App, TAbstractFile, TFile } from "obsidian";

export class FileSuggest extends AbstractInputSuggest<TFile> {
	constructor(app: App, inputEl: HTMLInputElement) {
		super(app, inputEl);
	}

	getSuggestions(inputStr: string): TFile[] {
		const lowerCaseInputStr = inputStr.toLowerCase();
		return this.app.vault.getAllLoadedFiles().filter((file: TAbstractFile): file is TFile =>
			file instanceof TFile &&
			file.extension === "md" &&
			file.path.toLowerCase().includes(lowerCaseInputStr)
		);
	}

	renderSuggestion(file: TFile, el: HTMLElement): void {
		el.setText(file.path);
	}

	selectSuggestion(file: TFile): void {
		this.setValue(file.path);
		this.close();
	}
}
