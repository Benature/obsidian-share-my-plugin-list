
export function processFunding(m: any): string {
	let info: string = "";
	if (m.fundingUrl) {
		if (typeof (m.fundingUrl) == 'string') {
			info += ` [♡](${m.fundingUrl})`;
		} else if (typeof (m.fundingUrl) == 'object') {
			let sep = " "
			for (let key in m.fundingUrl) {
				const url = m.fundingUrl[key]
				let symbol = "♡"
				let domain = /https?:\/\/([\w\.]+)\//g.exec(url);
				if (domain) {
					switch (domain[1]) {
						case "www.buymeacoffee.com":
							symbol = "☕️"; break;
						case "afdian.net":
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




export async function touchFolder(vault: any, folder: string, debug: boolean = false) {
	if (debug) {
		console.log("touch Folder", folder);
	}
	if (await vault.adapter.exists(folder)) {
		return;
	}
	const folders = folder.split(/[\/\\]/);
	if (folders.length > 1) {
		await touchFolder(vault, folders.slice(0, -1).join("/"));
	}
	await vault.adapter.mkdir(folder);
}
