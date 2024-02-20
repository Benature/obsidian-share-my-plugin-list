import { EN } from "./en";
import { ZH } from "./zh";
// import { ZHtw } from "./zh-tw";

export interface LocalProperty {
	commandGenerateList: string;
	commandGenerateTable: string;
	commandExportFile: string;
	genTableTemplateHeading: string;
	genTableTemplateAlign: string;
}

export class Locals {

	static get(): LocalProperty {
		const lang = window.localStorage.getItem("language");
		switch (lang) {
			case "zh":
				return ZH;
			// case "zh-tw":
			// 	return ZHtw;
			default:
				return EN;
		}
	}
}
