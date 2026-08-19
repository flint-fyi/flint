import { SyntaxKind } from "typescript";

import {
	getTSNodeRange,
	typescriptLanguage,
	type AST,
	type Checker,
} from "@flint.fyi/typescript-language";

import { ruleCreator } from "./ruleCreator.ts";

export default ruleCreator.createRule(typescriptLanguage, {
	about: {
		description:
			"Reports using `.filter()[0]` instead of `.find()` when looking for a single element.",
		id: "arrayFinds",
		presets: ["stylistic", "stylisticStrict"],
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
						node.argumentExpression.kind !== SyntaxKind.NumericLiteral ||
						node.argumentExpression.text !== "0" ||
						!isFilterCall(node.expression, typeChecker)
					) {
						return;
					}

					const arrayText =
						node.expression.expression.expression.getText(sourceFile);
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
		node.kind === SyntaxKind.CallExpression &&
		node.expression.kind === SyntaxKind.PropertyAccessExpression &&
		!!node.arguments.length &&
		node.expression.name.text === "filter" &&
		typeChecker.isArrayType(
			typeChecker.getTypeAtLocation(node.expression.expression),
		)
	);
}
