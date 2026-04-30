import { markdownLanguage } from "@flint.fyi/markdown-language";

import { ruleCreator } from "./ruleCreator.ts";

export default ruleCreator.createRule(markdownLanguage, {
	about: {
		description: "Reports duplicate definition identifiers (case-insensitive).",
		id: "definitionDuplicates",
		presets: ["logical"],
	},
	messages: {
		duplicateDefinition: {
			primary:
				"This definition identifier '{{ identifier }}' is already defined.",
			secondary: [
				"In Markdown, defining the same identifier multiple times can lead to unintended or incorrect link and image references.",
				"Only the first definition for an identifier is used, making subsequent definitions misleading.",
				"Definition identifiers are case-insensitive, so 'earth' and 'Earth' are treated as duplicates.",
			],
			suggestions: [
				"Rename one of the duplicate definitions",
				"Remove the duplicate definition if it's not needed",
			],
		},
	},
	setup(context) {
		const seenIdentifiers = new Map<
			string,
			{ begin: number; end: number; identifier: string }
		>();

		return {
			visitors: {
				definition(node) {
					if (node.identifier === "//") {
						return;
					}

					const normalizedIdentifier = node.identifier.toLowerCase();
					const begin = node.position.start.offset;
					const end = begin + node.identifier.length + 2;

					if (seenIdentifiers.has(normalizedIdentifier)) {
						context.report({
							data: { identifier: node.identifier },
							message: "duplicateDefinition",
							range: { begin, end },
						});
					} else {
						seenIdentifiers.set(normalizedIdentifier, {
							begin,
							end,
							identifier: node.identifier,
						});
					}
				},
			},
		};
	},
});
