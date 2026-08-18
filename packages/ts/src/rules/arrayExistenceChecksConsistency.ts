import { SyntaxKind } from "typescript";

import {
	getTSNodeRange,
	typescriptLanguage,
	type AST,
} from "@flint.fyi/typescript-language";

import { ruleCreator } from "./ruleCreator.ts";

const indexMethods = new Set([
	"findIndex",
	"findLastIndex",
	"indexOf",
	"lastIndexOf",
]);

export default ruleCreator.createRule(typescriptLanguage, {
	about: {
		description:
			"Reports inconsistent styles for checking element existence using index methods.",
		id: "arrayExistenceChecksConsistency",
		presets: ["stylistic", "stylisticStrict"],
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

function detectIssue(operator: SyntaxKind, value: number) {
	switch (operator) {
		case SyntaxKind.GreaterThanEqualsToken:
			return value === 0 && (["preferNotEqualsMinusOne", "!=="] as const);
		case SyntaxKind.GreaterThanToken:
			return value === -1 && (["preferNotEqualsMinusOne", "!=="] as const);
		case SyntaxKind.LessThanToken:
			return value === 0 && (["preferEqualsMinusOne", "==="] as const);
	}
}

function getNumericLiteralValue(node: AST.AnyNode): number | undefined {
	if (node.kind === SyntaxKind.NumericLiteral) {
		return Number(node.text);
	}

	if (
		node.kind === SyntaxKind.PrefixUnaryExpression &&
		node.operator === SyntaxKind.MinusToken &&
		node.operand.kind === SyntaxKind.NumericLiteral
	) {
		return -Number(node.operand.text);
	}

	return undefined;
}

function getOperatorText(kind: SyntaxKind) {
	switch (kind) {
		case SyntaxKind.GreaterThanEqualsToken:
			return ">=";
		case SyntaxKind.GreaterThanToken:
			return ">";
		case SyntaxKind.LessThanEqualsToken:
			return "<=";
		case SyntaxKind.LessThanToken:
			return "<";
		default:
			return "";
	}
}

function isComparisonOperator(kind: SyntaxKind) {
	return (
		kind === SyntaxKind.LessThanToken ||
		kind === SyntaxKind.LessThanEqualsToken ||
		kind === SyntaxKind.GreaterThanToken ||
		kind === SyntaxKind.GreaterThanEqualsToken
	);
}

function isIndexMethodCall(node: AST.AnyNode) {
	return (
		node.kind === SyntaxKind.CallExpression &&
		node.expression.kind === SyntaxKind.PropertyAccessExpression &&
		indexMethods.has(node.expression.name.text) &&
		node
	);
}
