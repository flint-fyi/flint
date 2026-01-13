import { typescriptLanguage } from "@flint.fyi/ts";

const problematicEntities = [
	{ entity: '"', toBrace: '{"\\""}', toHTML: "&quot;" },
	{ entity: "'", toBrace: '{"\'"}', toHTML: "&#39;" },
	{ entity: ">", toBrace: "{'>'}", toHTML: "&gt;" },
	{ entity: "}", toBrace: "{'}'}", toHTML: "&#125;" },
];

export default typescriptLanguage.createRule({
	about: {
		description:
			"Disallow unescaped HTML entities in JSX text that may cause rendering issues.",
		id: "unescapedEntities",
		preset: "stylistic",
	},
	messages: {
		unescapedEntity: {
			primary: "This unescaped entity `{{ entity }}` may not render properly.",
			secondary: [
				"Certain characters like >, <, \", ', {, and } can cause issues in JSX when not properly escaped.",
				"React may not render these characters correctly or they might break JSX syntax.",
			],
			suggestions: [
				"Use HTML entities: {{ html }}",
				"Wrap in JSX expression: {{ brace }}",
			],
		},
	},
	setup(context) {
		return {
			visitors: {
				JsxText(node, { sourceFile }) {
					const nodeStart = node.getStart(sourceFile);
					const reports: {
						begin: number;
						data: { brace: string; entity: string; html: string };
						end: number;
					}[] = [];

					for (const { entity, toBrace, toHTML } of problematicEntities) {
						let index = 0;
						while ((index = node.text.indexOf(entity, index)) !== -1) {
							reports.push({
								begin: nodeStart + index,
								data: {
									brace: toBrace,
									entity,
									html: toHTML,
								},
								end: nodeStart + index + entity.length,
							});
							index += entity.length;
						}
					}

					for (const report of reports.toSorted((a, b) => a.begin - b.begin)) {
						context.report({
							data: report.data,
							message: "unescapedEntity",
							range: {
								begin: report.begin,
								end: report.end,
							},
						});
					}
				},
			},
		};
	},
});
