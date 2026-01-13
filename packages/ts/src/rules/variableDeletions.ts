import { SyntaxKind } from "typescript";

import { typescriptLanguage } from "../language.ts";

export default typescriptLanguage.createRule({
	about: {
		description:
			"Reports attempting to delete variables with the delete operator.",
		id: "variableDeletions",
		preset: "untyped",
	},
	messages: {
		noDeleteVar: {
			primary:
				"Deleting a variable with the delete operator outside of strict mode will silently fail and return false.",
			secondary: [
				"The delete operator is only meant to remove properties from objects, not variables.",
				"Attempting to delete a variable in strict mode will cause a syntax error.",
				"In non-strict mode, it will silently fail and return false without actually deleting the variable.",
			],
			suggestions: [
				"Remove the delete statement, or if you need to unset the value, assign undefined instead.",
			],
		},
	},
	setup(context) {
		return {
			visitors: {
				DeleteExpression: (node, { sourceFile }) => {
					if (node.expression.kind === SyntaxKind.Identifier) {
						context.report({
							message: "noDeleteVar",
							range: {
								begin: node.getStart(sourceFile),
								end: node.getEnd(),
							},
						});
					}
				},
			},
		};
	},
});
