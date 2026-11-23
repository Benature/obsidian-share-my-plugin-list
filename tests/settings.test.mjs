import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { after, before, test } from "node:test";
import { build } from "esbuild";

let tempDir;
let ShareMyPluginSettingTab;

before(async () => {
	tempDir = await mkdtemp(join(tmpdir(), "share-my-plugin-list-settings-"));
	const outfile = join(tempDir, "settings.mjs");
	await build({
		entryPoints: ["src/setting/setting.ts"],
		bundle: true,
		format: "esm",
		platform: "node",
		outfile,
		plugins: [{
			name: "settings-test-stubs",
			setup(builder) {
				builder.onResolve({ filter: /^obsidian$/ }, () => ({ path: "obsidian", namespace: "stub" }));
				builder.onResolve({ filter: /(?:FileSuggest|funding)$/ }, args => ({ path: args.path, namespace: "stub" }));
				builder.onLoad({ filter: /^obsidian$/, namespace: "stub" }, () => ({
					contents: "export class PluginSettingTab {} export class Setting {} export class Notice {}",
					loader: "js",
				}));
				builder.onLoad({ filter: /(?:FileSuggest|funding)$/, namespace: "stub" }, args => ({
					contents: args.path.endsWith("funding") ? "export const addFundingElement = () => {};" : "export class FileSuggest {}",
					loader: "js",
				}));
			},
		}],
	});
	({ ShareMyPluginSettingTab } = await import(pathToFileURL(outfile).href));
});

after(async () => {
	await rm(tempDir, { recursive: true, force: true });
});

test("settings render into the row preserved by Obsidian 1.15", () => {
	const tab = Object.create(ShareMyPluginSettingTab.prototype);
	const setting = { settingEl: { id: "setting-row" } };
	const group = { listEl: { id: "host-managed-group-list" } };
	let renderedTo;
	tab.renderSettings = containerEl => { renderedTo = containerEl; };

	const [definition] = tab.getSettingDefinitions();
	definition.render(setting, group);

	assert.equal(renderedTo, setting.settingEl);
	assert.notEqual(renderedTo, group.listEl);
});
