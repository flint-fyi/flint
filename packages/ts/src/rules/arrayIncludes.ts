import * as ts from "typescript";

import { getTSNodeRange } from "../getTSNodeRange.ts";
import { typescriptLanguage } from "../language.ts";
import { getConstrainedTypeAtLocation } from "./utils/getConstrainedType.ts";

function hasIncludesMethod(type: ts.Type, typeChecker: ts.TypeChecker) {
	const includesProperty = type.getProperty("includes");
	if (!includesProperty) {
		return false;
	}

	const includesType = typeChecker.getTypeOfSymbol(includesProperty);
	return includesType.getCallSignatures().length > 0;
}

function isIndexOfCall(node: ts.CallExpression) {
	if (!ts.isPropertyAccessExpression(node.expression)) {
		return false;
	}

	return node.expression.name.text === "indexOf";
}

function isIndexOfComparison(
	node: ts.BinaryExpression,
	typeChecker: ts.TypeChecker,
) {
	const { left, operatorToken, right } = node;

	let indexOfCall: ts.CallExpression | undefined;
	let comparedValue: ts.Expression | undefined;

	if (ts.isCallExpression(left) && isIndexOfCall(left)) {
		indexOfCall = left;
		comparedValue = right;
	} else if (ts.isCallExpression(right) && isIndexOfCall(right)) {
		indexOfCall = right;
		comparedValue = left;
	}

	if (!indexOfCall || !comparedValue) {
		return undefined;
	}

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
	const isNegOne = isNegativeOne(comparedValue);
	const isZeroVal = isZero(comparedValue);

	const indexOfOnLeft = ts.isCallExpression(left);

	const isValidComparison =
		(isNegOne &&
			(op === ts.SyntaxKind.ExclamationEqualsToken ||
				op === ts.SyntaxKind.ExclamationEqualsEqualsToken ||
				op === ts.SyntaxKind.EqualsEqualsToken ||
				op === ts.SyntaxKind.EqualsEqualsEqualsToken ||
				(indexOfOnLeft && op === ts.SyntaxKind.GreaterThanToken) ||
				(!indexOfOnLeft && op === ts.SyntaxKind.LessThanToken))) ||
		(isZeroVal &&
			((indexOfOnLeft && op === ts.SyntaxKind.GreaterThanEqualsToken) ||
				(!indexOfOnLeft && op === ts.SyntaxKind.LessThanEqualsToken)));

	if (!isValidComparison) {
		return undefined;
	}

	return { indexOfCall, node };
}

function isNegativeOne(node: ts.Expression) {
	if (
		ts.isPrefixUnaryExpression(node) &&
		node.operator === ts.SyntaxKind.MinusToken &&
		ts.isNumericLiteral(node.operand) &&
		node.operand.text === "1"
	) {
		return true;
	}

	return false;
}

function isZero(node: ts.Expression) {
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
			primary: "Prefer `.includes()` over `.indexOf()` comparison.",
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
