
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


export function processPlugins(originPlugins: any) {
	let plugins: any = {};
	for (let name in originPlugins) {
		try {
			let plugin = originPlugins[name];
			// this.debug(plugin);
			plugin.manifest.pluginUrl = `https://obsidian.md/plugins?id=${plugin.manifest.id}`;
			plugin.manifest["author2"] = plugin.manifest.author?.replace(/<.*?@.*?\..*?>/g, "").trim(); // remove email address
			plugins[name] = plugin;
		} catch (e) {
			console.error(name, e)
		}
	}
	if ("obsidian42-brat" in plugins == false) {
		return plugins;
	}
	const BRAT = plugins["obsidian42-brat"];
	for (let p of BRAT.settings.pluginList) {
		const pSplit = p.split("/");
		let githubAuthor: string = pSplit[0], name: string = pSplit[1];
		let find = false;
		if (name.toLowerCase() in plugins) {
			find = true;
		} else {
			name = name.toLowerCase().replace(/^obsidian-?/g, "");
			if (name in plugins) { find = true; }
		}

		if (find) {
			plugins[name].manifest.pluginUrl = `https://github.com/${p}`;
		}
	}
	return plugins;
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
