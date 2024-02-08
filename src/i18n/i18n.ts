import { EN } from "./en";
import { LocalProperty } from "./types";
import { ZH } from "./zh";
import { ZHtw } from "./zh-tw";

export class Locals {

	static get(): LocalProperty {
		const lang = window.localStorage.getItem("language");
		switch (lang) {
			case "zh":
				return ZH;
			case "zh-tw":
				return ZHtw;
			default:
				return EN;
		}
	}
}
