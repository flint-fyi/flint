import * as ts from "typescript";

import { getTSNodeRange } from "../getTSNodeRange.ts";
import { typescriptLanguage } from "../language.ts";

const indexMethods = new Set([
	"findIndex",
	"findLastIndex",
	"indexOf",
	"lastIndexOf",
]);

export default typescriptLanguage.createRule({
	about: {
		description:
			"Reports inconsistent styles for checking element existence using index methods.",
		id: "arrayExistenceChecksConsistency",
		preset: "stylistic",
	},
	messages: {
		preferEqualsMinusOne: {
			primary:
				"Prefer `{{ replacement }}` over `{{ original }}` to check for non-existence.",
			secondary: [
				"Using `=== -1` is clearer and more consistent than `< 0`.",
				"Index methods return -1 when an element is not found, so checking against -1 is more explicit.",
			],
			suggestions: ["Replace with `{{ replacement }}`."],
		},
		preferNotEqualsMinusOne: {
			primary:
				"Prefer `{{ replacement }}` over `{{ original }}` to check for existence.",
			secondary: [
				"Using `!== -1` is clearer and more consistent than `>= 0` or `> -1`.",
				"Index methods return -1 when an element is not found, so checking against -1 is more explicit.",
			],
			suggestions: ["Replace with `{{ replacement }}`."],
		},
	},
	setup(context) {
		return {
			visitors: {
				BinaryExpression: (node, { sourceFile }) => {
					if (
						!isComparisonOperator(node.operatorToken.kind) ||
						!isIndexMethodCall(node.left)
					) {
						return;
					}

					const numberValue = getNumericLiteralValue(node.right);
					if (numberValue === undefined) {
						return;
					}

					const issue = detectIssue(node.operatorToken.kind, numberValue);
					if (!issue) {
						return;
					}

					const indexCallText = node.left.getText(sourceFile);
					const original = `${indexCallText} ${getOperatorText(node.operatorToken.kind)} ${numberValue}`;
					const replacement = `${indexCallText} ${issue[1]} -1`;

					context.report({
						data: { original, replacement },
						fix: {
							range: getTSNodeRange(node, sourceFile),
							text: replacement,
						},
						message: issue[0],
						range: {
							begin: node.operatorToken.getStart(sourceFile),
							end: node.right.getEnd(),
						},
					});
				},
			},
		};
	},
});

function detectIssue(operator: ts.SyntaxKind, value: number) {
	switch (operator) {
		case ts.SyntaxKind.GreaterThanEqualsToken:
			return value === 0 && (["preferNotEqualsMinusOne", "!=="] as const);
		case ts.SyntaxKind.GreaterThanToken:
			return value === -1 && (["preferNotEqualsMinusOne", "!=="] as const);
		case ts.SyntaxKind.LessThanToken:
			return value === 0 && (["preferEqualsMinusOne", "==="] as const);
	}
}

function getNumericLiteralValue(node: ts.Node): number | undefined {
	if (ts.isNumericLiteral(node)) {
		return Number(node.text);
	}

	if (
		ts.isPrefixUnaryExpression(node) &&
		node.operator === ts.SyntaxKind.MinusToken &&
		ts.isNumericLiteral(node.operand)
	) {
		return -Number(node.operand.text);
	}

	return undefined;
}

function getOperatorText(kind: ts.SyntaxKind) {
	switch (kind) {
		case ts.SyntaxKind.GreaterThanEqualsToken:
			return ">=";
		case ts.SyntaxKind.GreaterThanToken:
			return ">";
		case ts.SyntaxKind.LessThanEqualsToken:
			return "<=";
		case ts.SyntaxKind.LessThanToken:
			return "<";
		default:
			return "";
	}
}

function isComparisonOperator(kind: ts.SyntaxKind) {
	return (
		kind === ts.SyntaxKind.LessThanToken ||
		kind === ts.SyntaxKind.LessThanEqualsToken ||
		kind === ts.SyntaxKind.GreaterThanToken ||
		kind === ts.SyntaxKind.GreaterThanEqualsToken
	);
}

function isIndexMethodCall(node: ts.Node) {
	return (
		ts.isCallExpression(node) &&
		ts.isPropertyAccessExpression(node.expression) &&
		indexMethods.has(node.expression.name.text) &&
		node
	);
}
