import { markdownLanguage } from "@flint.fyi/markdown-language";

import { ruleCreator } from "./ruleCreator.ts";

export default ruleCreator.createRule(markdownLanguage, {
	about: {
		description: "Reports links with empty URLs or only empty fragments.",
		id: "linkContents",
		presets: ["logical"],
	},
	messages: {
		emptyLink: {
			primary: "This link has an empty URL.",
			secondary: [
				"Links without a URL destination result in broken or non-functional links.",
				"Empty URLs are often created as placeholders when writing but forgotten to be filled in.",
				"A link with an empty URL or only an empty fragment (#) provides no actual navigation.",
			],
			suggestions: [
				"Add a valid URL for the link",
				"Remove the link if it's not needed",
			],
		},
	},
	setup(context) {
		return {
			visitors: {
				link(node) {
					if (!node.url || node.url === "#") {
						context.report({
							message: "emptyLink",
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
