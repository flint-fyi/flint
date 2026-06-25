import * as ts from "typescript";

import {
	getStaticNumberValue,
	getTSNodeRange,
	typescriptLanguage,
	type AST,
	type Checker,
} from "@flint.fyi/typescript-language";

import { ruleCreator } from "./ruleCreator.ts";
import { getConstrainedTypeAtLocation } from "./utils/getConstrainedType.ts";

function hasIncludesMethod(node: AST.Expression, typeChecker: Checker) {
	const receiverType = getConstrainedTypeAtLocation(node, typeChecker);
	const includesProperty = receiverType.getProperty("includes");

	return (
		includesProperty &&
		!!typeChecker.getTypeOfSymbol(includesProperty).getCallSignatures().length
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

	if (
		!ts.isPropertyAccessExpression(indexOfCall.expression) ||
		!hasIncludesMethod(indexOfCall.expression.expression, typeChecker)
	) {
		return undefined;
	}

	const kind = operatorToken.kind;
	const comparedNumber = getStaticNumberValue(comparedValue);
	const indexOfOnLeft = ts.isCallExpression(left);

	const isValidComparison =
		(comparedNumber === -1 &&
			(kind === ts.SyntaxKind.ExclamationEqualsToken ||
				kind === ts.SyntaxKind.ExclamationEqualsEqualsToken ||
				kind === ts.SyntaxKind.EqualsEqualsToken ||
				kind === ts.SyntaxKind.EqualsEqualsEqualsToken ||
				(indexOfOnLeft && kind === ts.SyntaxKind.GreaterThanToken) ||
				(!indexOfOnLeft && kind === ts.SyntaxKind.LessThanToken))) ||
		(comparedNumber === 0 &&
			((indexOfOnLeft && kind === ts.SyntaxKind.GreaterThanEqualsToken) ||
				(!indexOfOnLeft && kind === ts.SyntaxKind.LessThanEqualsToken)));

	return isValidComparison && { indexOfCall, node };
}

export default ruleCreator.createRule(typescriptLanguage, {
	about: {
		description:
			"Reports using `.indexOf()` comparisons that can be replaced with `.includes()`.",
		id: "arrayIncludes",
		presets: ["stylistic", "stylisticStrict"],
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
