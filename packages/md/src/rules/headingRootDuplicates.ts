import { markdownLanguage } from "@flint.fyi/markdown-language";

import { ruleCreator } from "./ruleCreator.ts";

export default ruleCreator.createRule(markdownLanguage, {
	about: {
		description: "Reports multiple H1 headings in the same document.",
		id: "headingRootDuplicates",
		presets: ["logical", "logicalStrict"],
	},
	messages: {
		multipleH1: {
			primary:
				"This element is an invalid additional H1 heading after the document's first.",
			secondary: [
				"An H1 heading defines the main heading of a page and provides important structural information.",
				"Using more than one H1 heading can cause confusion for screen readers and break content hierarchy.",
				"Best practice is to use a single H1 heading per document for clarity and accessibility.",
			],
			suggestions: [
				"Use H2 (##) or lower for subsequent headings",
				"Consider if this content should be split into multiple documents",
			],
		},
	},
	setup(context) {
		const h1HeadingRanges: {
			begin: number;
			end: number;
		}[] = [];

		return {
			visitors: {
				heading(node) {
					if (node.depth === 1) {
						h1HeadingRanges.push({
							begin: node.position.start.offset,
							end: node.position.end.offset,
						});
					}
				},
				html(node) {
					if (/<h1[\s>]/i.test(node.value)) {
						h1HeadingRanges.push({
							begin: node.position.start.offset,
							end: node.position.end.offset,
						});
					}
				},
				root() {
					h1HeadingRanges.length = 0;
				},
				"root:exit"() {
					if (h1HeadingRanges.length > 1) {
						for (const range of h1HeadingRanges.slice(1)) {
							context.report({
								message: "multipleH1",
								range,
							});
						}
					}
				},
			},
		};
	},
});
