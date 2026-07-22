import { SyntaxKind } from "typescript";

import {
	getTSNodeRange,
	typescriptLanguage,
	type AST,
	type Checker,
} from "@flint.fyi/typescript-language";

import { ruleCreator } from "./ruleCreator.ts";
import { isArrayOrTupleTypeAtLocation } from "./utils/isArrayOrTupleTypeAtLocation.ts";
import { isDirectEqualityCheck } from "./utils/isDirectEqualityCheck.ts";

function isSomeWithDirectEquality(
	node: AST.CallExpression,
	typeChecker: Checker,
) {
	// TODO: Use a util like getStaticValue
	// https://github.com/flint-fyi/flint/issues/1298
	if (
		node.expression.kind !== SyntaxKind.PropertyAccessExpression ||
		node.expression.name.text !== "some" ||
		node.arguments.length !== 1
	) {
		return false;
	}

	// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
	const callback = node.arguments[0]!;

	if (
		(callback.kind !== SyntaxKind.ArrowFunction &&
			callback.kind !== SyntaxKind.FunctionExpression) ||
		callback.parameters.length !== 1
	) {
		return false;
	}

	// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
	const firstParameter = callback.parameters[0]!;

	return (
		firstParameter.name.kind === SyntaxKind.Identifier &&
		isDirectEqualityCheck(
			callback,
			[SyntaxKind.EqualsEqualsToken, SyntaxKind.EqualsEqualsEqualsToken],
			firstParameter.name.text,
		) &&
		isArrayOrTupleTypeAtLocation(node.expression.expression, typeChecker)
	);
}

export default ruleCreator.createRule(typescriptLanguage, {
	about: {
		description:
			"Reports using `Array#some()` with simple equality checks that can be replaced with `.includes()`.",
		id: "arrayIncludesMethods",
		presets: ["stylistic", "stylisticStrict"],
	},
	messages: {
		preferIncludes: {
			primary:
				"Prefer `.includes()` over `.some()` with a simple equality check.",
			secondary: [
				"`Array.prototype.some()` is intended for more complex predicate checks.",
				"For simple equality checks, `.includes()` is more readable and expressive.",
			],
			suggestions: [
				"Replace `.some(x => x === value)` with `.includes(value)`.",
			],
		},
	},
	setup(context) {
		return {
			visitors: {
				CallExpression: (node, { sourceFile, typeChecker }) => {
					if (isSomeWithDirectEquality(node, typeChecker)) {
						context.report({
							message: "preferIncludes",
							range: getTSNodeRange(node, sourceFile),
						});
					}
				},
			},
		};
	},
});
