const EN = {
	command: {
		GenerateList: 'Export as List',
		GenerateTable: 'Export as Table',
		ExportFile: "Export to file",
	},
	genTableTemplate: {
		Heading: "|Name|Author|Version|",
		Align: "|----|------|-------|",
	}
}

const ZH = {
	command: {
		GenerateList: '导出为列表',
		GenerateTable: '导出为表格',
		ExportFile: "导出到文件"
	},
	genTableTemplate: {
		Heading: "|名称|作者|版本|",
		Align: "|---|---|---|"
	}
}

const ZHtw = {
	command: {
		GenerateList: '匯出為列表',
		GenerateTable: '匯出為表格',
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
