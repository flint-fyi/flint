import {
	type AST,
	type Checker,
	getTSNodeRange,
	typescriptLanguage,
} from "@flint.fyi/typescript-language";
import * as ts from "typescript";

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
		!ts.isPropertyAccessExpression(node.expression) ||
		node.expression.name.text !== "some" ||
		node.arguments.length !== 1
	) {
		return false;
	}

	// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
	const callback = node.arguments[0]!;

	if (
		(!ts.isArrowFunction(callback) && !ts.isFunctionExpression(callback)) ||
		callback.parameters.length !== 1
	) {
		return false;
	}

	// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
	const firstParameter = callback.parameters[0]!;

	return (
		firstParameter.name.kind === ts.SyntaxKind.Identifier &&
		isDirectEqualityCheck(
			callback,
			[ts.SyntaxKind.EqualsEqualsToken, ts.SyntaxKind.EqualsEqualsEqualsToken],
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
