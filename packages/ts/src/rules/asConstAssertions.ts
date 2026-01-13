import * as ts from "typescript";

import { getTSNodeRange } from "../getTSNodeRange.ts";
import type { AST } from "../index.ts";
import { typescriptLanguage } from "../language.ts";

// TODO: Use a util like getStaticValue
// https://github.com/flint-fyi/flint/issues/1298
function getTextValue(node: AST.Expression | AST.TypeNode): string | undefined {
	switch (node.kind) {
		case ts.SyntaxKind.FalseKeyword:
			return "false";
		case ts.SyntaxKind.LiteralType:
			return getTextValue(node.literal);
		case ts.SyntaxKind.NumericLiteral:
			return node.text;
		case ts.SyntaxKind.StringLiteral:
			return node.text;
		case ts.SyntaxKind.TrueKeyword:
			return "true";
	}
}

function isLiteralType(node: AST.TypeNode): boolean {
	return (
		ts.isLiteralTypeNode(node) &&
		(ts.isStringLiteral(node.literal) ||
			ts.isNumericLiteral(node.literal) ||
			node.literal.kind === ts.SyntaxKind.TrueKeyword ||
			node.literal.kind === ts.SyntaxKind.FalseKeyword)
	);
}

export default typescriptLanguage.createRule({
	about: {
		description:
			"Reports using explicit literal types when `as const` can be used.",
		id: "asConstAssertions",
		preset: "stylistic",
	},
	messages: {
		preferAsConst: {
			primary: "Prefer `as const` over an explicit literal type assertion.",
			secondary: [
				"`as const` tells TypeScript to infer the literal type automatically.",
				"This avoids repeating the literal value and is more concise.",
			],
			suggestions: ["Replace the explicit literal type with `as const`."],
		},
		preferAsConstAnnotation: {
			primary: "Prefer `as const` over a literal type annotation.",
			secondary: [
				"When the literal type matches the initializer value, use `as const` instead.",
				"This avoids repeating the literal value and is more concise.",
			],
			suggestions: [
				"Remove the type annotation and add `as const` to the initializer.",
			],
		},
	},
	setup(context) {
		function compareTypes(
			expressionNode: AST.Expression,
			typeNode: AST.TypeNode,
			message: "preferAsConst" | "preferAsConstAnnotation",
			sourceFile: ts.SourceFile,
		) {
			const typeValue = getTextValue(typeNode);
			if (typeValue === undefined) {
				return;
			}

			const expressionValue = getTextValue(expressionNode);
			if (expressionValue === undefined) {
				return;
			}

			context.report({
				message,
				range: getTSNodeRange(typeNode, sourceFile),
			});
		}

		return {
			visitors: {
				AsExpression: (node, { sourceFile }) => {
					if (isLiteralType(node.type)) {
						compareTypes(
							node.expression,
							node.type,
							"preferAsConst",
							sourceFile,
						);
					}
				},

				VariableDeclaration: (node, { sourceFile }) => {
					if (node.initializer && node.type && isLiteralType(node.type)) {
						compareTypes(
							node.initializer,
							node.type,
							"preferAsConstAnnotation",
							sourceFile,
						);
					}
				},
			},
		};
	},
});
