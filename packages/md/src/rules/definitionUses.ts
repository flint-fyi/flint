import { markdownLanguage } from "@flint.fyi/markdown-language";
import type { WithPosition } from "@flint.fyi/markdown-language";
import type { Definition, ImageReference, Node, Root } from "mdast";

import { ruleCreator } from "./ruleCreator.ts";

export default ruleCreator.createRule(markdownLanguage, {
	about: {
		description: "Reports unused reference definitions.",
		id: "definitionUses",
		presets: ["logical"],
	},
	messages: {
		unusedDefinition: {
			primary: "This definition '{{ identifier }}' is never used.",
			secondary: [
				"Unused definitions add unnecessary clutter to the document and may indicate broken references or forgotten content.",
				"Reference-style definitions should be referenced by links, images, or other content in the document.",
				"Cleaning up unused definitions helps maintain a more organized document structure.",
			],
			suggestions: [
				"Remove the unused definition",
				"Add a reference to use this definition",
			],
		},
	},
	setup(context) {
		return {
			visitors: {
				root(root: WithPosition<Root>) {
					const definitions = new Map<
						string,
						{ begin: number; end: number; identifier: string }
					>();
					const usedIdentifiers = new Set<string>();

					function visitDefinition(node: Definition) {
						if (
							node.identifier === "//" ||
							node.position?.start.offset === undefined ||
							node.position.end.offset === undefined
						) {
							return;
						}

						const begin = node.position.start.offset;
						const end = begin + node.identifier.length + 2;

						definitions.set(node.identifier.toLowerCase(), {
							begin,
							end,
							identifier: node.identifier,
						});
					}

					function visit(node: Node): void {
						switch (node.type) {
							case "definition":
								visitDefinition(node as Definition);
								break;
							case "imageReference":
							case "linkReference":
								usedIdentifiers.add(
									(node as ImageReference).identifier.toLowerCase(),
								);
								break;
						}

						if ("children" in node && Array.isArray(node.children)) {
							for (const child of node.children as Node[]) {
								visit(child);
							}
						}
					}

					// TODO: Add :exit selectors, so this rule can report after traversal?
					visit(root);

					for (const [normalizedIdentifier, definition] of definitions) {
						if (!usedIdentifiers.has(normalizedIdentifier)) {
							context.report({
								data: { identifier: definition.identifier },
								message: "unusedDefinition",
								range: {
									begin: definition.begin,
									end: definition.end,
								},
							});
						}
					}
				},
			},
		};
	},
});
