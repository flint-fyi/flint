import {
	getTSNodeRange,
	typescriptLanguage,
} from "@flint.fyi/typescript-language";
import * as ts from "typescript";

import { ruleCreator } from "./ruleCreator.ts";

function isEmptyObjectLiteral(node: ts.Expression) {
	const unwrapped = unwrapParentheses(node);
	return (
		ts.isObjectLiteralExpression(unwrapped) && unwrapped.properties.length === 0
	);
}

function unwrapParentheses(node: ts.Expression): ts.Expression {
	return ts.isParenthesizedExpression(node)
		? unwrapParentheses(node.expression)
		: node;
}

export default ruleCreator.createRule(typescriptLanguage, {
	about: {
		description:
			"Reports empty object fallbacks in object spread expressions that have no effect.",
		id: "objectSpreadUnnecessaryFallbacks",
		presets: ["logical", "logicalStrict"],
	},
	messages: {
		unnecessaryFallback: {
			primary:
				"Spreading `undefined` or `null` in an object literal has no effect, making this empty object fallback unnecessary.",
			secondary: [
				"When spreading `undefined` or `null` in an object literal, JavaScript skips those values without throwing an error.",
				"A fallback like `|| {}` or `?? {}` is not needed because the spread will work correctly without it.",
			],
			suggestions: [
				"Remove the empty object fallback and spread the value directly.",
			],
		},
	},
	setup(context) {
		return {
			visitors: {
				ObjectLiteralExpression: (node, { sourceFile }) => {
					for (const property of node.properties) {
						if (!ts.isSpreadAssignment(property)) {
							continue;
						}

						const spreadExpression = unwrapParentheses(property.expression);
						if (!ts.isBinaryExpression(spreadExpression)) {
							continue;
						}

						const operatorKind = spreadExpression.operatorToken.kind;
						if (
							operatorKind !== ts.SyntaxKind.BarBarToken &&
							operatorKind !== ts.SyntaxKind.QuestionQuestionToken
						) {
							continue;
						}

						if (!isEmptyObjectLiteral(spreadExpression.right)) {
							continue;
						}

						context.report({
							message: "unnecessaryFallback",
							range: getTSNodeRange(spreadExpression.right, sourceFile),
						});
					}
				},
			},
		};
	},
});
