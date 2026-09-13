import { SyntaxKind } from "typescript-native/unstable/ast";

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
		node.expression.kind === SyntaxKind.PropertyAccessExpression &&
		node.expression.name.text === "indexOf"
	);
}

function isIndexOfComparison(node: AST.BinaryExpression, typeChecker: Checker) {
	const { left, operatorToken, right } = node;

	let indexOfAndValue: [AST.CallExpression, AST.Expression] | undefined;

	if (left.kind === SyntaxKind.CallExpression && isIndexOfCall(left)) {
		indexOfAndValue = [left, right];
	} else if (right.kind === SyntaxKind.CallExpression && isIndexOfCall(right)) {
		indexOfAndValue = [right, left];
	}

	if (!indexOfAndValue) {
		return undefined;
	}

	const [indexOfCall, comparedValue] = indexOfAndValue;

	if (
		indexOfCall.expression.kind !== SyntaxKind.PropertyAccessExpression ||
		!hasIncludesMethod(indexOfCall.expression.expression, typeChecker)
	) {
		return undefined;
	}

	const kind = operatorToken.kind;
	const comparedNumber = getStaticNumberValue(comparedValue);
	const indexOfOnLeft = left.kind === SyntaxKind.CallExpression;

	const isValidComparison =
		(comparedNumber === -1 &&
			(kind === SyntaxKind.ExclamationEqualsToken ||
				kind === SyntaxKind.ExclamationEqualsEqualsToken ||
				kind === SyntaxKind.EqualsEqualsToken ||
				kind === SyntaxKind.EqualsEqualsEqualsToken ||
				(indexOfOnLeft && kind === SyntaxKind.GreaterThanToken) ||
				(!indexOfOnLeft && kind === SyntaxKind.LessThanToken))) ||
		(comparedNumber === 0 &&
			((indexOfOnLeft && kind === SyntaxKind.GreaterThanEqualsToken) ||
				(!indexOfOnLeft && kind === SyntaxKind.LessThanEqualsToken)));

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
