import ts, { SyntaxKind } from "typescript";

import { typescriptLanguage } from "../language.ts";
import type * as AST from "../types/ast.ts";
import {
	isComparisonOperator,
	isEqualityOperator,
	isNegatedEqualityOperator,
} from "./utils/operators.ts";

function isNegativeZero(node: AST.Expression): boolean {
	return (
		node.kind === SyntaxKind.PrefixUnaryExpression &&
		node.operator === SyntaxKind.MinusToken &&
		node.operand.kind === SyntaxKind.NumericLiteral &&
		node.operand.text === "0"
	);
}

export default typescriptLanguage.createRule({
	about: {
		description: "Reports comparisons with -0 that may not behave as expected.",
		id: "negativeZeroComparisons",
		preset: "logical",
	},
	messages: {
		unexpectedNegativeZeroComparison: {
			primary:
				"Comparisons with -0 using {{ operator }} do not distinguish between -0 and +0.",
			secondary: [
				"In JavaScript, -0 and +0 are considered equal when using comparison operators like === or ==, even though they are distinct values.",
				"To properly check for -0, use `Object.is(value, -0)` which correctly distinguishes between -0 and +0.",
			],
			suggestions: ["Use `Object.is()` to reliably check if a value is -0."],
		},
	},
	setup(context) {
		function generateObjectIsText(
			node: AST.BinaryExpression,
			isNegated: boolean,
			sourceFile: ts.SourceFile,
		) {
			const leftText = node.left.getText(sourceFile);
			const rightText = node.right.getText(sourceFile);
			const objectIsCall = `Object.is(${leftText}, ${rightText})`;

			return isNegated ? `!${objectIsCall}` : objectIsCall;
		}

		return {
			visitors: {
				BinaryExpression: (node, { sourceFile }) => {
					if (
						!isComparisonOperator(node.operatorToken) ||
						(!isNegativeZero(node.left) && !isNegativeZero(node.right))
					) {
						return;
					}

					const operator = node.operatorToken.getText(sourceFile);
					const range = {
						begin: node.getStart(sourceFile),
						end: node.getEnd(),
					};

					context.report({
						data: {
							operator,
						},
						message: "unexpectedNegativeZeroComparison",
						range,
						suggestions: isEqualityOperator(node.operatorToken)
							? [
									{
										id: "useObjectIs",
										range,
										text: generateObjectIsText(
											node,
											isNegatedEqualityOperator(node.operatorToken),
											sourceFile,
										),
									},
								]
							: undefined,
					});
				},
			},
		};
	},
});
