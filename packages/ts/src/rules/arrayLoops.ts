import * as ts from "typescript";

import { getTSNodeRange } from "../getTSNodeRange.ts";
import { typescriptLanguage } from "../language.ts";
import { getConstrainedTypeAtLocation } from "./utils/getConstrainedType.ts";

function isArrayType(type: ts.Type, typeChecker: ts.TypeChecker) {
	if (typeChecker.isArrayType(type)) {
		return true;
	}

	if (typeChecker.isTupleType(type)) {
		return true;
	}

	return false;
}

function isForEachCall(node: ts.CallExpression) {
	if (!ts.isPropertyAccessExpression(node.expression)) {
		return false;
	}

	return node.expression.name.text === "forEach" && node.arguments.length >= 1;
}

export default typescriptLanguage.createRule({
	about: {
		description: "Reports using `.forEach()` when a for-of loop can be used.",
		id: "arrayLoops",
		presets: ["stylistic"],
	},
	messages: {
		preferForOf: {
			primary: "Prefer a for-of loop over `.forEach()`.",
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
					if (!isForEachCall(node)) {
						return;
					}

					if (!ts.isPropertyAccessExpression(node.expression)) {
						return;
					}

					const receiverType = getConstrainedTypeAtLocation(
						node.expression.expression,
						typeChecker,
					);

					if (!isArrayType(receiverType, typeChecker)) {
						return;
					}

					context.report({
						message: "preferForOf",
						range: getTSNodeRange(node, sourceFile),
					});
				},
			},
		};
	},
});
