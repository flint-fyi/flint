import { markdownLanguage } from "@flint.fyi/markdown-language";

import { ruleCreator } from "./ruleCreator.ts";

export default ruleCreator.createRule(markdownLanguage, {
	about: {
		description:
			"Reports table rows with column counts that don't match the header.",
		id: "tableColumnCounts",
		presets: ["logical"],
	},
	messages: {
		tooManyCells: {
			primary:
				"This table row has {{ actual }} cells but the header has {{ expected }}.",
			secondary: [
				"In GitHub Flavored Markdown tables, data rows should not have more cells than the header row.",
				"Extra cells beyond the header column count can lead to lost data or rendering issues.",
				"Ensure all data rows have at most the same number of cells as the header.",
			],
			suggestions: [
				"Remove extra cells from this row",
				"Add columns to the header if needed",
			],
		},
	},
	setup(context) {
		return {
			visitors: {
				table: (node) => {
					if (node.children.length === 0) {
						return;
					}

					// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
					const headerRow = node.children[0]!;
					const dataRows = node.children.slice(1);

					for (const dataRow of dataRows) {
						const dataCellCount = dataRow.children.length;

						if (
							dataCellCount <= headerRow.children.length ||
							dataRow.position?.start.offset === undefined ||
							dataRow.position.end.offset === undefined
						) {
							continue;
						}

						context.report({
							data: {
								actual: dataCellCount,
								expected: headerRow.children.length,
							},
							message: "tooManyCells",
							range: {
								begin: dataRow.position.start.offset,
								end: dataRow.position.end.offset,
							},
						});
					}
				},
			},
		};
	},
});
