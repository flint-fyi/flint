import {
	isElementAccessExpression,
	isNumericLiteral,
	isPrefixUnaryExpression,
	isStringLiteral,
} from "typescript";
import type { Expression } from "typescript";
import { SyntaxKind } from "typescript";

import { typescriptLanguage } from "../language.ts";

function isAcceptableIndexExpression(property: Expression): boolean {
	return (
		isStringLiteral(property) ||
		isNumericLiteral(property) ||
		(isPrefixUnaryExpression(property) &&
			property.operator === SyntaxKind.MinusToken &&
			isNumericLiteral(property.operand))
	);
}

export default typescriptLanguage.createRule({
	about: {
		description:
			"Disallow using the delete operator on computed key expressions.",
		id: "dynamicDeletes",
		preset: "logical",
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
						!isElementAccessExpression(argument) ||
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
