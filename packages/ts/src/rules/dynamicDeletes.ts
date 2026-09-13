import { SyntaxKind } from "typescript-native/unstable/ast";

import { typescriptLanguage, type AST } from "@flint.fyi/typescript-language";

import { ruleCreator } from "./ruleCreator.ts";

function isAcceptableIndexExpression(property: AST.Expression): boolean {
	return (
		property.kind === SyntaxKind.StringLiteral ||
		property.kind === SyntaxKind.NumericLiteral ||
		(property.kind === SyntaxKind.PrefixUnaryExpression &&
			property.operator === SyntaxKind.MinusToken &&
			property.operand.kind === SyntaxKind.NumericLiteral)
	);
}

export default ruleCreator.createRule(typescriptLanguage, {
	about: {
		description:
			"Disallow using the delete operator on computed key expressions.",
		id: "dynamicDeletes",
		presets: ["logical", "logicalStrict"],
	},
	messages: {
		dynamicDelete: {
			primary:
				"Using the `delete` operator on a computed key can be dangerous and is often not well optimized.",
			secondary: [
				"In modern code, JavaScript objects are generally intended to be optimized as static shapes by engines.",
				"Consider using a `Map` or `Set` if you need to dynamically add and remove keys.",
			],
			suggestions: [
				"Use a `Map` or `Set` instead of an object for dynamic keys.",
			],
		},
	},
	setup(context) {
		return {
			visitors: {
				DeleteExpression: (node, { sourceFile }) => {
					const argument = node.expression;

					if (
						argument.kind !== SyntaxKind.ElementAccessExpression ||
						isAcceptableIndexExpression(argument.argumentExpression)
					) {
						return;
					}

					const property = argument.argumentExpression;

					context.report({
						message: "dynamicDelete",
						range: {
							begin: property.getStart(sourceFile),
							end: property.getEnd(),
						},
					});
				},
			},
		};
	},
});
