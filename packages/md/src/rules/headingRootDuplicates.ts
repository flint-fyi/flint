import type { Heading, Html, Node, Root } from "mdast";

import { markdownLanguage } from "../language.ts";
import type { WithPosition } from "../nodes.ts";
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
		return {
			visitors: {
				root(root: WithPosition<Root>) {
					const h1HeadingRanges: {
						begin: number;
						end: number;
					}[] = [];

					function isH1(node: WithPosition<Node>) {
						switch (node.type) {
							case "heading":
								return (node as Heading).depth === 1;
							case "html":
								return /<h1[\s>]/i.test((node as Html).value);
							default:
								return false;
						}
					}

					function visit(node: WithPosition<Node>): void {
						if (isH1(node)) {
							h1HeadingRanges.push({
								begin: node.position.start.offset,
								end: node.position.end.offset,
							});
						}

						if ("children" in node && Array.isArray(node.children)) {
							for (const child of node.children as WithPosition<Node>[]) {
								visit(child);
							}
						}
					}

					// TODO: Add :exit selectors, so this rule can report after traversal?
					visit(root);

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
