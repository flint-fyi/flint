import { markdownLanguage } from "@flint.fyi/markdown-language";
import type { WithPosition } from "@flint.fyi/markdown-language";
import type { Node, Root, Text } from "mdast";

const invalidPattern = /\[[^\]]+\]\[\s+\]/g;

import { ruleCreator } from "./ruleCreator.ts";

export default ruleCreator.createRule(markdownLanguage, {
	about: {
		description: "Reports invalid label references with whitespace.",
		id: "labelReferenceValidity",
		presets: ["logical"],
	},
	messages: {
		invalidWhitespace: {
			primary: "This label reference has invalid whitespace between brackets.",
			secondary: [
				"CommonMark's shorthand label reference syntax ([label][]) does not allow whitespace between the brackets.",
				"While GitHub may render this correctly, CommonMark-compliant renderers will not treat this as a link reference.",
				"Remove the whitespace between the brackets to make this valid across all Markdown renderers.",
			],
			suggestions: [
				"Remove whitespace between the brackets",
				"Use the full reference syntax: [label][label]",
			],
		},
	},
	setup(context) {
		return {
			visitors: {
				root(root: WithPosition<Root>) {
					function visitText(node: Text) {
						if (
							node.position?.start.offset === undefined ||
							node.position.end.offset === undefined
						) {
							return;
						}

						let match: null | RegExpExecArray;

						while ((match = invalidPattern.exec(node.value))) {
							const begin = node.position.start.offset + match.index;
							const end = begin + match[0].length;

							context.report({
								message: "invalidWhitespace",
								range: {
									begin,
									end,
								},
							});
						}
					}

					// Traverse the tree to find text nodes
					function visit(node: Node): void {
						if (node.type === "text") {
							visitText(node as Text);
						} else if ("children" in node && Array.isArray(node.children)) {
							for (const child of node.children as Node[]) {
								visit(child);
							}
						}
					}

					// TODO: Add :exit selectors, so this rule can report after traversal?
					visit(root);
				},
			},
		};
	},
});
