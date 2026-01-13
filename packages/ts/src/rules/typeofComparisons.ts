import ts, { SyntaxKind } from "typescript";

import { getTSNodeRange } from "../getTSNodeRange.ts";
import { typescriptLanguage } from "../language.ts";
import * as AST from "../types/ast.ts";

const validTypeofValues = new Set([
	"bigint",
	"boolean",
	"function",
	"number",
	"object",
	"string",
	"symbol",
	"undefined",
]);

// TODO: Reuse a shared getStaticValue-style utility?
// https://github.com/flint-fyi/flint/issues/1298
function getStringValue(node: AST.Expression) {
	return node.kind === SyntaxKind.StringLiteral ||
		node.kind === SyntaxKind.NoSubstitutionTemplateLiteral
		? node.text
		: undefined;
}

function getTypeofOperand(node: AST.Expression) {
	return node.kind === SyntaxKind.TypeOfExpression && node.expression;
}

export default typescriptLanguage.createRule({
	about: {
		description:
			"Reports typeof expressions that compare impossible string literals.",
		id: "typeofComparisons",
		preset: "untyped",
	},
	messages: {
		invalidValue: {
			primary:
				"This string literal is not one that the typeof operator will ever produce.",
			secondary: [
				"The typeof operator returns one of a specific set of string values.",
				"Comparing typeof to an invalid string is usually a typo and will never match.",
				'The only valid values are: "bigint", "boolean", "function", "number", "object", "string", "symbol", and "undefined".',
			],
			suggestions: [
				"Check for typos and use one of the valid typeof return values.",
			],
		},
	},
	setup(context) {
		function checkComparison(
			node: AST.BinaryExpression,
			sourceFile: ts.SourceFile,
		) {
			const leftTypeofOperand = getTypeofOperand(node.left);
			const rightTypeofOperand = getTypeofOperand(node.right);

			let comparisonValue: AST.Expression | undefined;
			if (leftTypeofOperand) {
				comparisonValue = node.right;
			} else if (rightTypeofOperand) {
				comparisonValue = node.left;
			} else {
				return;
			}

			const stringValue = getStringValue(comparisonValue);
			if (stringValue != null && !validTypeofValues.has(stringValue)) {
				context.report({
					message: "invalidValue",
					range: getTSNodeRange(comparisonValue, sourceFile),
				});
			}
		}

		return {
			visitors: {
				BinaryExpression: (node, { sourceFile }) => {
					if (
						node.operatorToken.kind === SyntaxKind.EqualsEqualsToken ||
						node.operatorToken.kind === SyntaxKind.EqualsEqualsEqualsToken ||
						node.operatorToken.kind === SyntaxKind.ExclamationEqualsToken ||
						node.operatorToken.kind === SyntaxKind.ExclamationEqualsEqualsToken
					) {
						checkComparison(node, sourceFile);
					}
				},
			},
		};
	},
});
