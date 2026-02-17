import { markdownLanguage } from "@flint.fyi/markdown-language";
import type { WithPosition } from "@flint.fyi/markdown-language";
import type { Definition, Node, Root, Text } from "mdast";

// Pattern to match label references: ![text][label], [text][label], [label][], or [label]
// Includes optional ! for images
const labelPattern = /!?\[(?<left>[^[\]\\]*)\]\[(?<right>[^\]\\]*)\]/g;

import { ruleCreator } from "./ruleCreator.ts";

export default ruleCreator.createRule(markdownLanguage, {
	about: {
		description: "Reports missing label references.",
		id: "labelReferences",
		presets: ["logical"],
	},
	messages: {
		missingLabel: {
			primary: "This label reference '{{ identifier }}' has no definition.",
			secondary: [
				"Markdown allows you to use labels as placeholders for URLs in links and images.",
				"If a label is referenced but never defined, Markdown doesn't render a link and instead renders plain text.",
				"Each label reference must have a corresponding definition somewhere in the document.",
			],
			suggestions: [
				"Add a definition for this label",
				"Remove the label reference if it's not needed",
			],
		},
	},
	setup(context) {
		return {
			visitors: {
				root(root: WithPosition<Root>) {
					const definitions = new Set<string>();
					const references: {
						begin: number;
						end: number;
						identifier: string;
					}[] = [];

					function visitTextNode(node: Text) {
						if (
							node.position?.start.offset === undefined ||
							node.position.end.offset === undefined
						) {
							return;
						}

						let match: null | RegExpExecArray;

						while ((match = labelPattern.exec(node.value))) {
							if (!match.groups) {
								break;
							}
							const { left, right } = match.groups;

							// Skip empty references like [][]
							if (!left && !right) {
								continue;
							}

							const identifier = right
								? right.trim() || (left?.trim() ?? "")
								: (left?.trim() ?? "");

							if (!identifier) {
								continue;
							}

							const begin =
								node.position.start.offset +
								match.index +
								(node.value.startsWith("!") ? 2 : 1);
							const end = begin + identifier.length;

							references.push({ begin, end, identifier });
						}
					}

					function visit(node: Node): void {
						if (node.type === "definition") {
							definitions.add((node as Definition).identifier.toLowerCase());
						} else if (node.type === "text") {
							visitTextNode(node as Text);
						}

						if ("children" in node && Array.isArray(node.children)) {
							for (const child of node.children as Node[]) {
								visit(child);
							}
						}
					}

					// TODO: Add :exit selectors, so this rule can report after traversal
					// https://github.com/flint-fyi/flint/issues/2269
					visit(root);

					for (const reference of references) {
						if (!definitions.has(reference.identifier.toLowerCase())) {
							context.report({
								data: { identifier: reference.identifier },
								message: "missingLabel",
								range: {
									begin: reference.begin,
									end: reference.end,
								},
							});
						}
					}
				},
			},
		};
	},
});
