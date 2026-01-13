import * as ts from "typescript";

import { getTSNodeRange } from "../getTSNodeRange.ts";
import type { AST, Checker } from "../index.ts";
import { typescriptLanguage } from "../language.ts";
import { isArrayOrTupleTypeAtLocation } from "./utils/isArrayOrTupleTypeAtLocation.ts";

function isArrayFilterCall(
	node: AST.Expression,
	typeChecker: Checker,
): node is AST.CallExpression {
	return (
		ts.isCallExpression(node) &&
		ts.isPropertyAccessExpression(node.expression) &&
		node.expression.name.text === "filter" &&
		node.arguments.length > 0 &&
		node.arguments.length <= 2 &&
		isArrayOrTupleTypeAtLocation(node.expression.expression, typeChecker)
	);
}

// TODO: Use a util like getStaticValue
// https://github.com/flint-fyi/flint/issues/1298
function isNegativeOneIndex(node: AST.Expression): boolean {
	return (
		ts.isPrefixUnaryExpression(node) &&
		node.operator === ts.SyntaxKind.MinusToken &&
		ts.isNumericLiteral(node.operand) &&
		node.operand.text === "1"
	);
}

// TODO: Use a util like getStaticValue
// https://github.com/flint-fyi/flint/issues/1298
function isZeroIndex(node: AST.Expression) {
	return ts.isNumericLiteral(node) && node.text === "0";
}

export default typescriptLanguage.createRule({
	about: {
		description:
			"Reports using `.filter()` when only the first or last matching element is needed.",
		id: "arrayFilteredFinds",
		presets: ["logical"],
	},
	messages: {
		preferFind: {
			primary: "Prefer `.find()` over `.filter()[0]`.",
			secondary: [
				"Using `.filter()` to get only the first matching element creates an unnecessary intermediate array.",
				"The `.find()` method is more efficient as it stops iteration once a match is found.",
			],
			suggestions: ["Replace `.filter(callback)[0]` with `.find(callback)`."],
		},
		preferFindLast: {
			primary:
				"Prefer `.findLast()` over `.filter().pop()` or `.filter().at(-1)`.",
			secondary: [
				"Using `.filter()` to get only the last matching element creates an unnecessary intermediate array.",
				"The `.findLast()` method is more efficient as it iterates from the end and stops once a match is found.",
			],
			suggestions: [
				"Replace `.filter(callback).pop()` or `.filter(callback).at(-1)` with `.findLast(callback)`.",
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
					const objectExpression = node.expression.expression;

					switch (methodName) {
						case "pop":
							if (
								node.arguments.length === 0 &&
								isArrayFilterCall(objectExpression, typeChecker)
							) {
								context.report({
									message: "preferFindLast",
									range: getTSNodeRange(node, sourceFile),
								});
							}
							return;

						case "shift":
							if (
								node.arguments.length === 0 &&
								isArrayFilterCall(objectExpression, typeChecker)
							) {
								context.report({
									message: "preferFind",
									range: getTSNodeRange(node, sourceFile),
								});
							}
							return;

						case "at":
							if (node.arguments.length === 1) {
								// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
								const arg = node.arguments[0]!;

								if (
									isZeroIndex(arg) &&
									isArrayFilterCall(objectExpression, typeChecker)
								) {
									context.report({
										message: "preferFind",
										range: getTSNodeRange(node, sourceFile),
									});
									return;
								}

								if (
									isNegativeOneIndex(arg) &&
									isArrayFilterCall(objectExpression, typeChecker)
								) {
									context.report({
										message: "preferFindLast",
										range: getTSNodeRange(node, sourceFile),
									});
								}
							}
					}
				},
				ElementAccessExpression: (node, { sourceFile, typeChecker }) => {
					if (
						isZeroIndex(node.argumentExpression) &&
						isArrayFilterCall(node.expression, typeChecker)
					) {
						context.report({
							message: "preferFind",
							range: getTSNodeRange(node, sourceFile),
						});
					}
				},
			},
		};
	},
});
