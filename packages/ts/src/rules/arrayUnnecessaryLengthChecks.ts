import { SyntaxKind } from "typescript";

import {
	getTSNodeRange,
	typescriptLanguage,
	type AST,
} from "@flint.fyi/typescript-language";

import { ruleCreator } from "./ruleCreator.ts";

function haveSameArrayExpression(
	expr1: AST.Expression,
	expr2: AST.Expression,
	sourceFile: AST.SourceFile,
) {
	return expr1.getText(sourceFile) === expr2.getText(sourceFile);
}

function isLengthNonZeroCheck(node: AST.BinaryExpression) {
	const { left, operatorToken, right } = node;

	if (
		operatorToken.kind === SyntaxKind.ExclamationEqualsToken ||
		operatorToken.kind === SyntaxKind.ExclamationEqualsEqualsToken
	) {
		if (isLengthProperty(left) && isZero(right)) {
			return {
				arrayExpression: left.expression,
			};
		}
		if (isZero(left) && isLengthProperty(right)) {
			return {
				arrayExpression: right.expression,
			};
		}
	}

	if (
		operatorToken.kind === SyntaxKind.GreaterThanToken &&
		isLengthProperty(left) &&
		isZero(right)
	) {
		return {
			arrayExpression: left.expression,
		};
	}

	return undefined;
}

function isLengthProperty(
	node: AST.Expression,
): node is AST.PropertyAccessExpression {
	return (
		node.kind === SyntaxKind.PropertyAccessExpression &&
		node.name.text === "length"
	);
}

function isLengthZeroCheck(node: AST.BinaryExpression) {
	const { left, operatorToken, right } = node;

	if (
		operatorToken.kind === SyntaxKind.EqualsEqualsToken ||
		operatorToken.kind === SyntaxKind.EqualsEqualsEqualsToken
	) {
		if (isLengthProperty(left) && isZero(right)) {
			return {
				arrayExpression: left.expression,
				isZeroCheck: true,
			};
		}
		if (isZero(left) && isLengthProperty(right)) {
			return {
				arrayExpression: right.expression,
				isZeroCheck: true,
			};
		}
	}

	return undefined;
}

function isSomeOrEveryCall(node: AST.Expression, methodName: "every" | "some") {
	if (node.kind !== SyntaxKind.CallExpression) {
		return undefined;
	}

	if (node.expression.kind !== SyntaxKind.PropertyAccessExpression) {
		return undefined;
	}

	if (node.expression.name.text !== methodName) {
		return undefined;
	}

	return node.expression.expression;
}

function isZero(node: AST.Expression) {
	return node.kind === SyntaxKind.NumericLiteral && node.text === "0";
}

export default ruleCreator.createRule(typescriptLanguage, {
	about: {
		description:
			"Reports unnecessary array length checks before `.some()` or `.every()` calls.",
		id: "arrayUnnecessaryLengthChecks",
		presets: ["logical"],
	},
	messages: {
		unnecessaryLengthCheckEvery: {
			primary: "Unnecessary length check before `.every()`.",
			secondary: [
				"`.every()` returns `true` for an empty array, so checking `array.length === 0` before calling `.every()` is redundant.",
			],
			suggestions: ["Remove the length check."],
		},
		unnecessaryLengthCheckSome: {
			primary: "Unnecessary length check before `.some()`.",
			secondary: [
				"`.some()` returns `false` for an empty array, so checking `array.length !== 0` or `array.length > 0` before calling `.some()` is redundant.",
			],
			suggestions: ["Remove the length check."],
		},
	},
	setup(context) {
		return {
			visitors: {
				BinaryExpression: (node, { sourceFile }) => {
					if (node.operatorToken.kind === SyntaxKind.AmpersandAmpersandToken) {
						const { left, right } = node;

						if (left.kind !== SyntaxKind.BinaryExpression) {
							return;
						}

						const nonZeroCheck = isLengthNonZeroCheck(left);
						if (!nonZeroCheck) {
							return;
						}

						const someArrayExpr = isSomeOrEveryCall(right, "some");
						if (
							someArrayExpr &&
							haveSameArrayExpression(
								nonZeroCheck.arrayExpression,
								someArrayExpr,
								sourceFile,
							)
						) {
							context.report({
								fix: {
									range: getTSNodeRange(node, sourceFile),
									text: right.getText(sourceFile),
								},
								message: "unnecessaryLengthCheckSome",
								range: getTSNodeRange(left, sourceFile),
							});
						}
					}

					if (node.operatorToken.kind === SyntaxKind.BarBarToken) {
						const { left, right } = node;

						if (left.kind !== SyntaxKind.BinaryExpression) {
							return;
						}

						const zeroCheck = isLengthZeroCheck(left);
						if (!zeroCheck) {
							return;
						}

						const everyArrayExpr = isSomeOrEveryCall(right, "every");
						if (
							everyArrayExpr &&
							haveSameArrayExpression(
								zeroCheck.arrayExpression,
								everyArrayExpr,
								sourceFile,
							)
						) {
							context.report({
								fix: {
									range: getTSNodeRange(node, sourceFile),
									text: right.getText(sourceFile),
								},
								message: "unnecessaryLengthCheckEvery",
								range: getTSNodeRange(left, sourceFile),
							});
						}
					}
				},
			},
		};
	},
});
