
import { PluginManifest, Vault } from "obsidian";

type ManifestWithFunding = PluginManifest & {
	fundingUrl?: string | Record<string, string>;
};

export function processFunding(m: ManifestWithFunding): string {
	let info: string = "";
	if (m.fundingUrl) {
		if (typeof (m.fundingUrl) == 'string') {
			info += ` [♡](${m.fundingUrl})`;
		} else if (typeof (m.fundingUrl) == 'object') {
			let sep = " "
			for (let key in m.fundingUrl) {
				const url = m.fundingUrl[key]
				let symbol = "♡"
				let domain = /https?:\/\/([\w.]+)\//g.exec(url);
				if (domain) {
					switch (domain[1]) {
						case "www.buymeacoffee.com":
							symbol = "☕️"; break;
						case "afdian.net":
						case "afdian.com":
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


export function addTimestampToFilePath(path: string, date: Date = new Date()): string {
	const pad = (value: number) => value.toString().padStart(2, "0");
	const timestamp = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}_${pad(date.getHours())}-${pad(date.getMinutes())}`;
	const lastSlash = path.lastIndexOf("/");
	return `${path.slice(0, lastSlash + 1)}${timestamp}-${path.slice(lastSlash + 1)}`;
}


export async function touchFolder(vault: Vault, folder: string): Promise<void> {
	if (!folder || vault.getAbstractFileByPath(folder)) {
		return;
	}
	const folders = folder.split(/[/\\]/);
	if (folders.length > 1) {
		await touchFolder(vault, folders.slice(0, -1).join("/"));
	}
	await vault.createFolder(folder);
}
