import { markdownLanguage } from "@flint.fyi/markdown-language";

import { ruleCreator } from "./ruleCreator.ts";

export default ruleCreator.createRule(markdownLanguage, {
	about: {
		description: "Reports definitions with empty URLs or only empty fragments.",
		id: "definitionContents",
		presets: ["logical"],
	},
	messages: {
		emptyDefinition: {
			primary: "This definition has an empty URL.",
			secondary: [
				"Definitions in Markdown provide URLs for reference-style links and images.",
				"A definition with an empty URL or only an empty fragment (#) provides no useful destination and will result in broken links.",
				"Empty definitions are often created as placeholders but forgotten to be filled in.",
			],
			suggestions: [
				"Add a valid URL for the definition",
				"Remove the empty definition if it's not needed",
			],
		},
	},
	setup(context) {
		return {
			visitors: {
				definition(node) {
					if (node.identifier === "//") {
						return;
					}

					if (!node.url || node.url === "#") {
						context.report({
							message: "emptyDefinition",
							range: {
								begin: node.position.start.offset,
								end: node.position.end.offset,
							},
						});
					}
				},
			},
		};
	},
});
