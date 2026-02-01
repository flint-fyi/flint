import { typescriptLanguage } from "@flint.fyi/typescript-language";

import { ruleCreator } from "./ruleCreator.ts";

export default ruleCreator.createRule(typescriptLanguage, {
	about: {
		description: "Reports files with Unicode Byte Order Marks (BOMs).",
		id: "unicodeBOMs",
		presets: ["stylistic", "stylisticStrict"],
	},
	messages: {
		noBOM: {
			primary:
				"This Unicode Byte Order Mark (BOM) is unnecessary and can cause issues with some tools.",
			secondary: [
				"The Unicode BOM is a special character (U+FEFF) that can appear at the start of a file to indicate its byte order and encoding.",
				"While it can be useful in some contexts, it does not improve tooling portability and is not generally helpful for editors.",
			],
			suggestions: ["Remove the BOM from the beginning of the file."],
		},
	},
	setup(context) {
		return {
			visitors: {
				SourceFile: (node) => {
					const text = node.getFullText();
					if (text.charCodeAt(0) !== 0xfeff) {
						return {};
					}

					context.report({
						message: "noBOM",
						range: {
							begin: 0,
							end: 1,
						},
						suggestions: [
							{
								id: "removeBOM",
								range: {
									begin: 0,
									end: 1,
								},
								text: "",
							},
						],
					});
				},
			},
		};
	},
});
