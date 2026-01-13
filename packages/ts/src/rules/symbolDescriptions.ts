import { SyntaxKind } from "typescript";

import { typescriptLanguage } from "../language.ts";

export default typescriptLanguage.createRule({
	about: {
		description: "Reports Symbol() calls without description arguments.",
		id: "symbolDescriptions",
		preset: "stylistic",
	},
	messages: {
		missingDescription: {
			primary:
				"Symbols without descriptions are more difficult to debug or reason about.",
			secondary: [
				"Creating a symbol without a description makes debugging difficult, as the symbol's purpose isn't clear when inspecting it.",
				"While the description doesn't affect the symbol's uniqueness, it appears in the symbol's string representation and can be accessed via `Symbol.prototype.description`.",
			],
			suggestions: [
				"Add a descriptive string argument to the Symbol constructor that explains the symbol's purpose.",
			],
		},
	},
	setup(context) {
		return {
			visitors: {
				CallExpression: (node, { sourceFile }) => {
					if (
						node.expression.kind !== SyntaxKind.Identifier ||
						node.expression.text !== "Symbol" ||
						node.arguments.length
					) {
						return;
					}

					context.report({
						message: "missingDescription",
						range: {
							begin: node.getStart(sourceFile),
							end: node.getEnd(),
						},
					});
				},
			},
		};
	},
});
