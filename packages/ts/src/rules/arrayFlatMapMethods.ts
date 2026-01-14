import * as ts from "typescript";

import { getTSNodeRange } from "../getTSNodeRange.ts";
import type { AST, Checker } from "../index.ts";
import { typescriptLanguage } from "../language.ts";
import { isArrayOrTupleTypeAtLocation } from "./utils/isArrayOrTupleTypeAtLocation.ts";

function isArrayMapCall(
	node: AST.Expression,
	typeChecker: Checker,
): node is AST.CallExpression {
	return (
		ts.isCallExpression(node) &&
		ts.isPropertyAccessExpression(node.expression) &&
		node.expression.name.text === "map" &&
		node.arguments.length >= 1 &&
		isArrayOrTupleTypeAtLocation(node.expression.expression, typeChecker)
	);
}

function isFlatCallWithDepthOne(node: AST.CallExpression) {
	switch (node.arguments.length) {
		case 0:
			return true;

		case 1: {
			// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
			const firstArgument = node.arguments[0]!;

			// TODO: Use a util like getStaticValue
			// https://github.com/flint-fyi/flint/issues/1298
			return ts.isNumericLiteral(firstArgument) && firstArgument.text === "1";
		}

		default:
			return false;
	}
}

export default typescriptLanguage.createRule({
	about: {
		description: "Reports using `.map().flat()` when `.flatMap()` can be used.",
		id: "arrayFlatMapMethods",
		presets: ["stylistic"],
	},
	messages: {
		preferFlatMap: {
			primary: "Prefer `.flatMap()` over `.map().flat()`.",
			secondary: [
				"`.flatMap()` combines mapping and flattening in a single step, which is more concise and efficient.",
				"Using `.map().flat()` creates an intermediate array that is immediately discarded.",
			],
			suggestions: [
				"Replace `.map(callback).flat()` with `.flatMap(callback)`.",
			],
		},
	},
	setup(context) {
		return {
			visitors: {
				CallExpression: (node, { sourceFile, typeChecker }) => {
					if (!ts.isPropertyAccessExpression(node.expression)) {
						return;
					}

					const methodName = node.expression.name.text;
					if (methodName !== "flat") {
						return;
					}

					if (!isFlatCallWithDepthOne(node)) {
						return;
					}

					const objectExpression = node.expression.expression;
					if (!isArrayMapCall(objectExpression, typeChecker)) {
						return;
					}

					context.report({
						message: "preferFlatMap",
						range: getTSNodeRange(node, sourceFile),
					});
				},
			},
		};
	},
});
