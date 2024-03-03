const EN = {
	command: {
		GenerateActiveList: 'Export active plugins as list',
		GenerateActiveTable: 'Export active plugins as table',
		GenerateInactiveList: 'Export inactive plugins as list',
		GenerateInactiveTable: 'Export inactive plugins as table',
		ExportFile: "Export to file",
	},
	genTableTemplate: {
		Heading: "|Name|Author|Version|",
		Align: "|----|------|-------|",
	}
}

const ZH = {
	command: {
		GenerateActiveList: '导出启用插件列表',
		GenerateActiveTable: '导出启用插件表格',
		GenerateInactiveList: '导出禁用插件列表',
		GenerateInactiveTable: '导出禁用插件表格',
		ExportFile: "导出到文件"
	},
	genTableTemplate: {
		Heading: "|名称|作者|版本|",
		Align: "|---|---|---|"
	}
}

const ZHtw = {
	command: {
		GenerateActiveList: '匯出啟用插件列表',
		GenerateActiveTable: '匯出啟用插件表格',
		GenerateInactiveList: '匯出禁用插件列表',
		GenerateInactiveTable: '匯出禁用插件表格',
		ExportFile: "匯出到檔案"
	},
	genTableTemplate: {
		Heading: "|名稱|作者|版本|",
		Align: "|---|---|---|"
	}
}


export class Locals {
	static get() {
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
