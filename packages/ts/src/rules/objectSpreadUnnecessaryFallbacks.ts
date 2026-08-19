import { SyntaxKind } from "typescript";

import {
	getTSNodeRange,
	typescriptLanguage,
	type AST,
} from "@flint.fyi/typescript-language";

import { ruleCreator } from "./ruleCreator.ts";

function isEmptyObjectLiteral(node: AST.Expression) {
	const unwrapped = unwrapParentheses(node);
	return (
		unwrapped.kind === SyntaxKind.ObjectLiteralExpression &&
		!unwrapped.properties.length
	);
}

function unwrapParentheses(node: AST.Expression): AST.Expression {
	return node.kind === SyntaxKind.ParenthesizedExpression
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
						if (property.kind !== SyntaxKind.SpreadAssignment) {
							continue;
						}

						const spreadExpression = unwrapParentheses(property.expression);
						if (spreadExpression.kind !== SyntaxKind.BinaryExpression) {
							continue;
						}

						const operatorKind = spreadExpression.operatorToken.kind;
						if (
							operatorKind !== SyntaxKind.BarBarToken &&
							operatorKind !== SyntaxKind.QuestionQuestionToken
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
