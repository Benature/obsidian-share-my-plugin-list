# Share My Plugin List

![Obsidian Downloads](https://img.shields.io/badge/dynamic/json?logo=obsidian&color=%23483699&label=downloads&query=%24%5B%22share-my-plugin-list%22%5D.downloads&url=https%3A%2F%2Fraw.githubusercontent.com%2Fobsidianmd%2Fobsidian-releases%2Fmaster%2Fcommunity-plugin-stats.json) ![GitHub stars](https://img.shields.io/github/stars/Benature/obsidian-share-my-plugin-list?style=flat) ![latest download](https://img.shields.io/github/downloads/Benature/obsidian-share-my-plugin-list/latest/total?style=plastic) 

[Click to install](https://obsidian.md/plugins?id=share-my-plugin-list)

Share the obsidian plugins that are activated. 

This plugin helps you to share/recommend the plugins you are using to others.

<!-- ![ShareMyPluginList](https://github.com/Benature/obsidian-share-my-plugin-list/assets/35028647/f203165c-4c84-4fc4-9122-346f7ec7b34b) -->
<center>
<img src="https://s2.loli.net/2024/01/24/1STZknQCtmu4qwi.gif" />
</center>

## Some feature descriptions

### Export to file

You can export the list of activated plugins to a file with command `Export to file`. The file that will be saved in your vault folder can be configured in the plugin settings.

The exported content is surrounded by `<!-- ShareMyPlugin begin -->` and `<!-- ShareMyPlugin end -->`:
```md
<!-- ShareMyPlugin begin -->
- Plugin 1
- Plugin 2
- ...
<!-- ShareMyPlugin end -->
```
Contents between the comments will be overwritten by the plugin when you export again, whereas the contents outside the comments will be preserved.


## Support

If you find this plugin useful and would like to support its development, you can sponsor me via [Buy Me a Coffee ☕️](https://www.buymeacoffee.com/benature), WeChat, Alipay or [AiFaDian](https://afdian.net/a/Benature-K). Any amount is welcome, thank you!

<p align="center">
<img src="https://s2.loli.net/2024/01/30/jQ9fTSyBxvXRoOM.png" width="500px">
</p>

## Other install methods

### Install by [BRAT Plugin](https://obsidian.md/plugins?id=obsidian42-brat)

- First install [BRAT Plugin](https://obsidian.md/plugins?id=obsidian42-brat):
- In BRAT Plugin, click `Add Beta plugin`
- Enter https://github.com/Benature/obsidian-share-my-plugin-list
- Enable `Share My Plugin List` in `Community plugins`

### Manually install

- Download latest version in [Releases](https://github.com/Benature/obsidian-share-my-plugin-list/releases/latest)
- Copy over `main.js`, `manifest.json` to your vault `VaultFolder/.obsidian/plugins/metadata-icon/`
- Reload plugins in `Community plugins` and enable `Share My Plugin List`

## How to build

- `git clone https://github.com/Benature/obsidian-share-my-plugin-list` clone this repo.
- `npm i`  install dependencies
- `npm run dev` to start compilation in watch mode.
- `npm run build`  to build production.
