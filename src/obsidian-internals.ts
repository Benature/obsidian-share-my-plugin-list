import type { App, PluginManifest } from "obsidian";

export interface SharePluginManifest extends PluginManifest {
	pluginUrl?: string;
	author2?: string;
	installLink?: string;
}

export interface PluginEntry {
	manifest: SharePluginManifest;
	disabled?: boolean;
	settings?: { pluginList?: string[] };
}

export type PluginMap = Record<string, PluginEntry>;

export interface PluginManager {
	plugins: PluginMap;
	manifests: Record<string, SharePluginManifest>;
	installPlugin(repo: string, version: string, manifest: PluginManifest): Promise<void>;
	loadPlugin(id: string): Promise<void>;
	enablePluginAndSave(id: string): Promise<void>;
	disablePlugin(id: string): Promise<void>;
}

export function getPluginManager(app: App): PluginManager {
	return (app as App & { plugins: PluginManager }).plugins;
}
