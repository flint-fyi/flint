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

function isFindIndexWithDirectEquality(
	node: AST.CallExpression,
	typeChecker: Checker,
) {
	if (!ts.isPropertyAccessExpression(node.expression)) {
		return undefined;
	}

	const methodName = node.expression.name.text;
	if (
		(methodName !== "findIndex" && methodName !== "findLastIndex") ||
		node.arguments.length !== 1
	) {
		return undefined;
	}

	// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
	const callback = node.arguments[0]!;

	if (
		(!ts.isArrowFunction(callback) && !ts.isFunctionExpression(callback)) ||
		callback.parameters.length !== 1
	) {
		return undefined;
	}

	// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
	const firstParameter = callback.parameters[0]!;

	if (
		firstParameter.name.kind !== ts.SyntaxKind.Identifier ||
		!isDirectEqualityCheck(
			callback,
			[ts.SyntaxKind.EqualsEqualsEqualsToken],
			firstParameter.name.text,
		) ||
		!isArrayOrTupleTypeAtLocation(node.expression.expression, typeChecker)
	) {
		return undefined;
	}

	return { methodName, node };
}

export default ruleCreator.createRule(typescriptLanguage, {
	about: {
		description:
			"Reports using `.findIndex()` or `.findLastIndex()` with simple equality checks that can be replaced with `.indexOf()` or `.lastIndexOf()`.",
		id: "arrayIndexOfMethods",
		presets: ["stylistic", "stylisticStrict"],
	},
	messages: {
		preferIndexOf: {
			primary:
				"Prefer `.indexOf()` over `.findIndex()` with a simple equality check.",
			secondary: [
				"`.findIndex()` is intended for more complex predicate checks.",
				"For simple equality checks, `.indexOf()` is more readable.",
			],
			suggestions: [
				"Replace `.findIndex(x => x === value)` with `.indexOf(value)`.",
			],
		},
		preferLastIndexOf: {
			primary:
				"Prefer `.lastIndexOf()` over `.findLastIndex()` with a simple equality check.",
			secondary: [
				"`.findLastIndex()` is intended for more complex predicate checks.",
				"For simple equality checks, `.lastIndexOf()` is more readable.",
			],
			suggestions: [
				"Replace `.findLastIndex(x => x === value)` with `.lastIndexOf(value)`.",
			],
		},
	},
	setup(context) {
		return {
			visitors: {
				CallExpression: (node, { sourceFile, typeChecker }) => {
					const result = isFindIndexWithDirectEquality(node, typeChecker);
					if (result) {
						context.report({
							message:
								result.methodName === "findIndex"
									? "preferIndexOf"
									: "preferLastIndexOf",
							range: getTSNodeRange(result.node, sourceFile),
						});
					}
				},
			},
		};
	},
});
