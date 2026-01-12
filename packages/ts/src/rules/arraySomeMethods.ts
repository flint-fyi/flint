import * as ts from "typescript";

import { getTSNodeRange } from "../getTSNodeRange.ts";
import type { AST } from "../index.ts";
import { typescriptLanguage } from "../language.ts";

export default typescriptLanguage.createRule({
	about: {
		description:
			"Reports patterns that can be replaced with `.some()` for checking array element existence.",
		id: "arraySomeMethods",
		preset: "stylistic",
	},
	messages: {
		preferSome: {
			primary:
				"Prefer `.some()` to more cleanly check if an array contains a matching element.",
			secondary: [
				"The `.some()` method is more explicit and efficient for existence checks.",
				"It stops iterating as soon as a match is found.",
			],
			suggestions: ["Replace with `.some()`."],
		},
	},
	setup(context) {
		return {
			visitors: {
				BinaryExpression: (node, { sourceFile, typeChecker }) => {
					const result =
						checkFilterLengthComparison(node, typeChecker) ??
						checkFindIndexComparison(node, typeChecker);
					if (!result) {
						return;
					}

					const arrayText = result.arrayExpression.getText(sourceFile);
					const callbackText = result.callback.getText(sourceFile);
					const range = getTSNodeRange(node, sourceFile);

					context.report({
						fix: {
							range,
							text: `${arrayText}.some(${callbackText})`,
						},
						message: "preferSome",
						range,
					});
				},
			},
		};
	},
});

function checkFilterLengthComparison(
	node: AST.BinaryExpression,
	typeChecker: ts.TypeChecker,
) {
	const lengthAccess = isNonZeroLengthCheck(node) && getLengthAccess(node);
	return lengthAccess
		? getFilterCall(lengthAccess.expression, typeChecker)
		: undefined;
}

function checkFindIndexComparison(
	node: AST.BinaryExpression,
	typeChecker: ts.TypeChecker,
) {
	return (
		isFindIndexNegativeOneCheck(node) &&
		ts.isCallExpression(node.left) &&
		getFindIndexCall(node.left, typeChecker)
	);
}

function getFilterCall(
	node: AST.LeftHandSideExpression,
	typeChecker: ts.TypeChecker,
) {
	if (
		!ts.isCallExpression(node) ||
		!ts.isPropertyAccessExpression(node.expression) ||
		node.expression.name.text !== "filter" ||
		node.arguments.length === 0 ||
		!isArrayType(node.expression.expression, typeChecker)
	) {
		return undefined;
	}

	return {
		arrayExpression: node.expression.expression,
		// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
		callback: node.arguments[0]!,
	};
}

function getFindIndexCall(
	node: AST.CallExpression,
	typeChecker: ts.TypeChecker,
) {
	if (
		!ts.isPropertyAccessExpression(node.expression) ||
		!["findIndex", "findLastIndex"].includes(node.expression.name.text) ||
		node.arguments.length === 0 ||
		!isArrayType(node.expression.expression, typeChecker)
	) {
		return undefined;
	}

	return {
		arrayExpression: node.expression.expression,
		// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
		callback: node.arguments[0]!,
	};
}

// TODO: Use a util like getStaticValue
// https://github.com/flint-fyi/flint/issues/1298
function getLengthAccess(node: AST.BinaryExpression) {
	return (
		ts.isPropertyAccessExpression(node.left) &&
		node.left.name.text === "length" &&
		node.left
	);
}

function isArrayType(node: ts.Expression, typeChecker: ts.TypeChecker) {
	const type = typeChecker.getTypeAtLocation(node);
	return typeChecker.isArrayType(type);
}

function isFindIndexNegativeOneCheck(node: AST.BinaryExpression) {
	if (
		node.operatorToken.kind !== ts.SyntaxKind.ExclamationEqualsEqualsToken ||
		!ts.isPrefixUnaryExpression(node.right) ||
		node.right.operator !== ts.SyntaxKind.MinusToken ||
		!ts.isNumericLiteral(node.right.operand)
	) {
		return false;
	}

	return node.right.operand.text === "1";
}

function isNonZeroLengthCheck(node: AST.BinaryExpression) {
	const { left, operatorToken, right } = node;

	if (
		operatorToken.kind === ts.SyntaxKind.GreaterThanToken &&
		ts.isNumericLiteral(right) &&
		right.text === "0"
	) {
		return true;
	}

	if (
		operatorToken.kind === ts.SyntaxKind.ExclamationEqualsEqualsToken &&
		ts.isNumericLiteral(right) &&
		right.text === "0"
	) {
		return true;
	}

	if (
		operatorToken.kind === ts.SyntaxKind.GreaterThanEqualsToken &&
		ts.isNumericLiteral(right) &&
		right.text === "1"
	) {
		return true;
	}

	if (
		operatorToken.kind === ts.SyntaxKind.LessThanToken &&
		ts.isNumericLiteral(left) &&
		left.text === "0"
	) {
		return true;
	}

	return false;
}
