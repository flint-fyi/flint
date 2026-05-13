import { markdownLanguage } from "@flint.fyi/markdown-language";

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
		const definitions = new Map<
			string,
			{ begin: number; end: number; identifier: string }
		>();
		const usedIdentifiers = new Set<string>();

		return {
			visitors: {
				definition(node) {
					if (node.identifier === "//") {
						return;
					}

					const begin = node.position.start.offset;
					const end = begin + node.identifier.length + 2;

					definitions.set(node.identifier.toLowerCase(), {
						begin,
						end,
						identifier: node.identifier,
					});
				},
				imageReference(node) {
					usedIdentifiers.add(node.identifier.toLowerCase());
				},
				linkReference(node) {
					usedIdentifiers.add(node.identifier.toLowerCase());
				},
				root() {
					definitions.clear();
					usedIdentifiers.clear();
				},
				"root:exit"() {
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
