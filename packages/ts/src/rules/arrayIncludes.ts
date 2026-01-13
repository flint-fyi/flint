import * as ts from "typescript";

import { getTSNodeRange } from "../getTSNodeRange.ts";
import type { AST, Checker } from "../index.ts";
import { typescriptLanguage } from "../language.ts";
import { getConstrainedTypeAtLocation } from "./utils/getConstrainedType.ts";

function hasIncludesMethod(type: ts.Type, typeChecker: ts.TypeChecker) {
	const includesProperty = type.getProperty("includes");

	return (
		includesProperty &&
		typeChecker.getTypeOfSymbol(includesProperty).getCallSignatures().length > 0
	);
}

function isIndexOfCall(node: AST.CallExpression) {
	// TODO: Use a util like getStaticValue
	// https://github.com/flint-fyi/flint/issues/1298
	return (
		ts.isPropertyAccessExpression(node.expression) &&
		node.expression.name.text === "indexOf"
	);
}

function isIndexOfComparison(node: AST.BinaryExpression, typeChecker: Checker) {
	const { left, operatorToken, right } = node;

	let indexOfAndValue: [AST.CallExpression, AST.Expression] | undefined;

	if (ts.isCallExpression(left) && isIndexOfCall(left)) {
		indexOfAndValue = [left, right];
	} else if (ts.isCallExpression(right) && isIndexOfCall(right)) {
		indexOfAndValue = [right, left];
	}

	if (!indexOfAndValue) {
		return undefined;
	}

	const [indexOfCall, comparedValue] = indexOfAndValue;

	if (!ts.isPropertyAccessExpression(indexOfCall.expression)) {
		return undefined;
	}

	const receiverType = getConstrainedTypeAtLocation(
		indexOfCall.expression.expression,
		typeChecker,
	);

	if (!hasIncludesMethod(receiverType, typeChecker)) {
		return undefined;
	}

	const op = operatorToken.kind;
	const isZeroValue = isZero(comparedValue);

	const indexOfOnLeft = ts.isCallExpression(left);

	const isValidComparison =
		(isNegativeOne(comparedValue) &&
			(op === ts.SyntaxKind.ExclamationEqualsToken ||
				op === ts.SyntaxKind.ExclamationEqualsEqualsToken ||
				op === ts.SyntaxKind.EqualsEqualsToken ||
				op === ts.SyntaxKind.EqualsEqualsEqualsToken ||
				(indexOfOnLeft && op === ts.SyntaxKind.GreaterThanToken) ||
				(!indexOfOnLeft && op === ts.SyntaxKind.LessThanToken))) ||
		(isZeroValue &&
			((indexOfOnLeft && op === ts.SyntaxKind.GreaterThanEqualsToken) ||
				(!indexOfOnLeft && op === ts.SyntaxKind.LessThanEqualsToken)));

	return isValidComparison && { indexOfCall, node };
}

// TODO: Use a util like getStaticValue
// https://github.com/flint-fyi/flint/issues/1298
function isNegativeOne(node: AST.Expression) {
	return (
		ts.isPrefixUnaryExpression(node) &&
		node.operator === ts.SyntaxKind.MinusToken &&
		ts.isNumericLiteral(node.operand) &&
		node.operand.text === "1"
	);
}

// TODO: Use a util like getStaticValue
// https://github.com/flint-fyi/flint/issues/1298
function isZero(node: AST.Expression) {
	return ts.isNumericLiteral(node) && node.text === "0";
}

export default typescriptLanguage.createRule({
	about: {
		description:
			"Reports using `.indexOf()` comparisons that can be replaced with `.includes()`.",
		id: "arrayIncludes",
		presets: ["stylistic"],
	},
	messages: {
		preferIncludes: {
			primary:
				"Prefer the cleaner `.includes()` over `.indexOf()` with a binary comparison.",
			secondary: [
				"Using `.includes()` is more readable and expressive than comparing `.indexOf()` against `-1` or `0`.",
				"ES2015 added `String.prototype.includes()` and ES2016 added `Array.prototype.includes()` for this purpose.",
			],
			suggestions: ["Replace the `.indexOf()` comparison with `.includes()`."],
		},
	},
	setup(context) {
		return {
			visitors: {
				BinaryExpression: (node, { sourceFile, typeChecker }) => {
					const result = isIndexOfComparison(node, typeChecker);
					if (result) {
						context.report({
							message: "preferIncludes",
							range: getTSNodeRange(result.node, sourceFile),
						});
					}
				},
			},
		};
	},
});
