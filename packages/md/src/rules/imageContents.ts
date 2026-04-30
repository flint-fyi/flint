import { markdownLanguage } from "@flint.fyi/markdown-language";

import { ruleCreator } from "./ruleCreator.ts";

export default ruleCreator.createRule(markdownLanguage, {
	about: {
		description: "Reports images with empty URLs or only empty fragments.",
		id: "imageContents",
		presets: ["logical"],
	},
	messages: {
		emptyImage: {
			primary: "This image has an empty URL.",
			secondary: [
				"Images without a URL destination result in broken image links.",
				"Empty URLs are often created as placeholders when writing but forgotten to be filled in.",
				"An image with an empty URL or only an empty fragment (#) provides no actual image content.",
			],
			suggestions: [
				"Add a valid URL for the image",
				"Remove the image if it's not needed",
			],
		},
	},
	setup(context) {
		return {
			visitors: {
				image(node) {
					if (!node.url || node.url === "#") {
						context.report({
							message: "emptyImage",
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
