import {
	type AST,
	getTSNodeRange,
	typescriptLanguage,
} from "@flint.fyi/typescript-language";
import * as ts from "typescript";

import { ruleCreator } from "./ruleCreator.ts";
import { isArrayOrTupleTypeAtLocation } from "./utils/isArrayOrTupleTypeAtLocation.ts";

// TODO: Use a util like getStaticValue
// https://github.com/flint-fyi/flint/issues/1298
function isForEachCall(
	node: AST.CallExpression,
): node is AST.CallExpression & { expression: AST.PropertyAccessExpression } {
	return (
		node.expression.kind === ts.SyntaxKind.PropertyAccessExpression &&
		node.expression.name.text === "forEach" &&
		node.arguments.length >= 1
	);
}

export default ruleCreator.createRule(typescriptLanguage, {
	about: {
		description: "Reports using `.forEach()` when a for-of loop can be used.",
		id: "arrayLoops",
		presets: ["stylistic"],
	},
	messages: {
		preferForOf: {
			primary: "Prefer a more direct for-of loop over `.forEach()`.",
			secondary: [
				"for-of loops are often more readable and offer benefits over `.forEach()`.",
				"for-of allows using `break` to exit early, `continue` to skip iterations, and `return` to exit the containing function.",
				"TypeScript type narrowing works better inside for-of loops since no function boundary is crossed.",
			],
			suggestions: ["Replace `.forEach(callback)` with a for-of loop."],
		},
	},
	setup(context) {
		return {
			visitors: {
				CallExpression: (node, { sourceFile, typeChecker }) => {
					if (
						isForEachCall(node) &&
						isArrayOrTupleTypeAtLocation(
							node.expression.expression,
							typeChecker,
						)
					) {
						context.report({
							message: "preferForOf",
							range: getTSNodeRange(node, sourceFile),
						});
					}
				},
			},
		};
	},
});
