import { type AST, typescriptLanguage } from "@flint.fyi/typescript-language";
import * as ts from "typescript";

import { ruleCreator } from "./ruleCreator.ts";

function containsOptionalChain(node: AST.Expression): boolean {
	let current: ts.Node = node;
	let foundNonOptionalAccess = false;

	while (true) {
		if (ts.isParenthesizedExpression(current)) {
			if (foundNonOptionalAccess) {
				return false;
			}

			return isOptionalChainRoot(current.expression);
		}

		if (ts.isNonNullExpression(current)) {
			current = current.expression;
			continue;
		}

		if (
			ts.isPropertyAccessExpression(current) ||
			ts.isElementAccessExpression(current) ||
			ts.isCallExpression(current)
		) {
			if (current.questionDotToken) {
				return true;
			}

			foundNonOptionalAccess = true;
			current = current.expression;
			continue;
		}

		return false;
	}
}

function isNonNullExpressionContinued(node: AST.NonNullExpression): boolean {
	if (ts.isParenthesizedExpression(node.expression)) {
		return false;
	}

	const { parent } = node;

	if (
		ts.isPropertyAccessExpression(parent) ||
		ts.isElementAccessExpression(parent) ||
		ts.isCallExpression(parent)
	) {
		return parent.expression === node;
	}

	return false;
}

function isOptionalChainRoot(node: ts.Node): boolean {
	let current: ts.Node = node;
	while (true) {
		if (ts.isParenthesizedExpression(current)) {
			current = current.expression;
			continue;
		}

		if (ts.isNonNullExpression(current)) {
			current = current.expression;
			continue;
		}

		if (
			ts.isPropertyAccessExpression(current) ||
			ts.isElementAccessExpression(current) ||
			ts.isCallExpression(current)
		) {
			return Boolean(current.questionDotToken);
		}

		return false;
	}
}

export default ruleCreator.createRule(typescriptLanguage, {
	about: {
		description: "Reports non-null assertions on optional chain expressions.",
		id: "nonNullAssertedOptionalChains",
		presets: ["logical"],
	},
	messages: {
		nonNullOptionalChain: {
			primary:
				"Non-null assertions are unsafe on optional chain expressions because they can still return undefined.",
			secondary: [
				"Optional chain expressions (`?.`) return `undefined` when the left side is `null` or `undefined`.",
				"Applying a non-null assertion (`!`) doesn't change the runtime behavior and can mask potential bugs.",
			],
			suggestions: ["Remove the non-null assertion."],
		},
	},
	setup(context) {
		return {
			visitors: {
				NonNullExpression: (node, { sourceFile }) => {
					if (!containsOptionalChain(node.expression)) {
						return;
					}

					if (isNonNullExpressionContinued(node)) {
						return;
					}

					const range = {
						begin: node.getStart(sourceFile),
						end: node.getEnd(),
					};

					context.report({
						message: "nonNullOptionalChain",
						range,
						suggestions: [
							{
								id: "removeNonNullAssertion",
								range,
								text: node.expression.getText(sourceFile),
							},
						],
					});
				},
			},
		};
	},
});
