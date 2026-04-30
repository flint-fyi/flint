import { markdownLanguage } from "@flint.fyi/markdown-language";
import type { WithPosition } from "@flint.fyi/markdown-language";
import type { Code, Node, Root } from "mdast";

import { ruleCreator } from "./ruleCreator.ts";

export default ruleCreator.createRule(markdownLanguage, {
	about: {
		description: "Reports fenced code blocks without a language specified.",
		id: "fencedCodeLanguages",
		presets: ["stylistic", "stylisticStrict"],
	},
	messages: {
		missingLanguage: {
			primary: "This fenced code block's language is ambiguous.",
			secondary: [
				"Fenced code blocks should specify a language for proper syntax highlighting.",
				"Even for plain text, it's preferable to use 'text' to indicate your intention.",
				"Specifying a language helps editors and converters properly display the code.",
			],
			suggestions: [
				"Add a language after the opening backticks (e.g., ```js)",
				"Use 'text' for plain text code blocks",
			],
		},
	},
	setup(context) {
		return {
			visitors: {
				root(node: WithPosition<Root>) {
					function visit(node: Node): void {
						if (
							node.type === "code" &&
							!(node as Code).lang &&
							node.position?.start.offset !== undefined &&
							node.position.end.offset !== undefined
						) {
							context.report({
								message: "missingLanguage",
								range: {
									begin: node.position.start.offset,
									end: node.position.end.offset,
								},
							});
							return;
						}

						if ("children" in node && Array.isArray(node.children)) {
							for (const child of node.children as Node[]) {
								visit(child);
							}
						}
					}

					visit(node);
				},
			},
		};
	},
});
