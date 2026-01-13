import * as ts from "typescript";

import { getTSNodeRange } from "../getTSNodeRange.ts";
import type { AST } from "../index.ts";
import { typescriptLanguage } from "../language.ts";

function haveSameArrayExpression(
	expr1: AST.Expression,
	expr2: AST.Expression,
	sourceFile: ts.SourceFile,
) {
	return expr1.getText(sourceFile) === expr2.getText(sourceFile);
}

function isLengthNonZeroCheck(node: AST.BinaryExpression) {
	const { left, operatorToken, right } = node;

	if (
		operatorToken.kind === ts.SyntaxKind.ExclamationEqualsToken ||
		operatorToken.kind === ts.SyntaxKind.ExclamationEqualsEqualsToken
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

	if (operatorToken.kind === ts.SyntaxKind.GreaterThanToken) {
		if (isLengthProperty(left) && isZero(right)) {
			return {
				arrayExpression: left.expression,
			};
		}
	}

	return undefined;
}

function isLengthProperty(
	node: AST.Expression,
): node is AST.PropertyAccessExpression {
	return ts.isPropertyAccessExpression(node) && node.name.text === "length";
}

function isLengthZeroCheck(node: AST.BinaryExpression) {
	const { left, operatorToken, right } = node;

	if (
		operatorToken.kind === ts.SyntaxKind.EqualsEqualsToken ||
		operatorToken.kind === ts.SyntaxKind.EqualsEqualsEqualsToken
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
	if (!ts.isCallExpression(node)) {
		return undefined;
	}

	if (!ts.isPropertyAccessExpression(node.expression)) {
		return undefined;
	}

	if (node.expression.name.text !== methodName) {
		return undefined;
	}

	return node.expression.expression;
}

function isZero(node: AST.Expression) {
	return ts.isNumericLiteral(node) && node.text === "0";
}

export default typescriptLanguage.createRule({
	about: {
		description:
			"Reports unnecessary array length checks before `.some()` or `.every()` calls.",
		id: "arrayUnnecessaryLengthChecks",
		preset: "logical",
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
					if (
						node.operatorToken.kind === ts.SyntaxKind.AmpersandAmpersandToken
					) {
						const { left, right } = node;

						if (!ts.isBinaryExpression(left)) {
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

					if (node.operatorToken.kind === ts.SyntaxKind.BarBarToken) {
						const { left, right } = node;

						if (!ts.isBinaryExpression(left)) {
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
