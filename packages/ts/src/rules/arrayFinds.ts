import * as ts from "typescript";

import { getTSNodeRange } from "../getTSNodeRange.ts";
import type { AST, Checker } from "../index.ts";
import { typescriptLanguage } from "../language.ts";

export default typescriptLanguage.createRule({
	about: {
		description:
			"Reports using `.filter()[0]` instead of `.find()` when looking for a single element.",
		id: "arrayFinds",
		preset: "stylistic",
	},
	messages: {
		preferFind: {
			primary:
				"Prefer `.find()` over `.filter()[0]` when looking for a single element.",
			secondary: [
				"Using `.find()` is more efficient because it stops searching after finding the first match.",
				"`.filter()[0]` unnecessarily iterates through the entire array.",
			],
			suggestions: ["Replace `.filter(...)[0]` with `.find(...)`."],
		},
	},
	setup(context) {
		return {
			visitors: {
				ElementAccessExpression: (node, { sourceFile, typeChecker }) => {
					if (
						!ts.isNumericLiteral(node.argumentExpression) ||
						node.argumentExpression.text !== "0" ||
						!isFilterCall(node.expression, typeChecker)
					) {
						return;
					}

					const arrayText = node.expression.expression.getText(sourceFile);
					const filterArgumentsText = node.expression.arguments
						.map((arg) => arg.getText(sourceFile))
						.join(", ");

					context.report({
						fix: {
							range: getTSNodeRange(node, sourceFile),
							text: `${arrayText}.find(${filterArgumentsText})`,
						},
						message: "preferFind",
						range: {
							begin: node.expression.expression.name.getStart(sourceFile),
							end: node.getEnd(),
						},
					});
				},
			},
		};
	},
});

function isFilterCall(
	node: AST.AnyNode,
	typeChecker: Checker,
): node is AST.CallExpression & { expression: AST.PropertyAccessExpression } {
	return (
		ts.isCallExpression(node) &&
		ts.isPropertyAccessExpression(node.expression) &&
		node.arguments.length !== 0 &&
		node.expression.name.text === "filter" &&
		typeChecker.isArrayType(
			typeChecker.getTypeAtLocation(node.expression.expression),
		)
	);
}
