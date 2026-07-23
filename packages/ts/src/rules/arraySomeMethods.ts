import { SyntaxKind, type TypeChecker } from "typescript";

import {
	getTSNodeRange,
	typescriptLanguage,
	type AST,
} from "@flint.fyi/typescript-language";

import { ruleCreator } from "./ruleCreator.ts";

export default ruleCreator.createRule(typescriptLanguage, {
	about: {
		description:
			"Reports patterns that can be replaced with `.some()` for checking array element existence.",
		id: "arraySomeMethods",
		presets: ["stylistic", "stylisticStrict"],
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
	typeChecker: TypeChecker,
) {
	const lengthAccess = isNonZeroLengthCheck(node) && getLengthAccess(node);
	return lengthAccess
		? getFilterCall(lengthAccess.expression, typeChecker)
		: undefined;
}

function checkFindIndexComparison(
	node: AST.BinaryExpression,
	typeChecker: TypeChecker,
) {
	return (
		isFindIndexNegativeOneCheck(node) &&
		node.left.kind === SyntaxKind.CallExpression &&
		getFindIndexCall(node.left, typeChecker)
	);
}

function getFilterCall(
	node: AST.LeftHandSideExpression,
	typeChecker: TypeChecker,
) {
	if (
		node.kind !== SyntaxKind.CallExpression ||
		node.expression.kind !== SyntaxKind.PropertyAccessExpression ||
		node.expression.name.text !== "filter" ||
		!node.arguments.length ||
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

function getFindIndexCall(node: AST.CallExpression, typeChecker: TypeChecker) {
	if (
		node.expression.kind !== SyntaxKind.PropertyAccessExpression ||
		!["findIndex", "findLastIndex"].includes(node.expression.name.text) ||
		!node.arguments.length ||
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
		node.left.kind === SyntaxKind.PropertyAccessExpression &&
		node.left.name.text === "length" &&
		node.left
	);
}

function isArrayType(node: AST.Expression, typeChecker: TypeChecker) {
	const type = typeChecker.getTypeAtLocation(node);
	return typeChecker.isArrayType(type);
}

function isFindIndexNegativeOneCheck(node: AST.BinaryExpression) {
	if (
		node.operatorToken.kind !== SyntaxKind.ExclamationEqualsEqualsToken ||
		node.right.kind !== SyntaxKind.PrefixUnaryExpression ||
		node.right.operator !== SyntaxKind.MinusToken ||
		node.right.operand.kind !== SyntaxKind.NumericLiteral
	) {
		return false;
	}

	return node.right.operand.text === "1";
}

function isNonZeroLengthCheck(node: AST.BinaryExpression) {
	const { left, operatorToken, right } = node;

	if (
		operatorToken.kind === SyntaxKind.GreaterThanToken &&
		right.kind === SyntaxKind.NumericLiteral &&
		right.text === "0"
	) {
		return true;
	}

	if (
		operatorToken.kind === SyntaxKind.ExclamationEqualsEqualsToken &&
		right.kind === SyntaxKind.NumericLiteral &&
		right.text === "0"
	) {
		return true;
	}

	if (
		operatorToken.kind === SyntaxKind.GreaterThanEqualsToken &&
		right.kind === SyntaxKind.NumericLiteral &&
		right.text === "1"
	) {
		return true;
	}

	if (
		operatorToken.kind === SyntaxKind.LessThanToken &&
		left.kind === SyntaxKind.NumericLiteral &&
		left.text === "0"
	) {
		return true;
	}

	return false;
}
