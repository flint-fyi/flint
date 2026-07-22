import { SyntaxKind } from "typescript";

import {
	getTSNodeRange,
	typescriptLanguage,
	type AST,
} from "@flint.fyi/typescript-language";

import { ruleCreator } from "./ruleCreator.ts";

// TODO: Use a util like getStaticValue
// https://github.com/flint-fyi/flint/issues/1298
function getTextValue(node: AST.Expression | AST.TypeNode): string | undefined {
	switch (node.kind) {
		case SyntaxKind.FalseKeyword:
			return "false";
		case SyntaxKind.LiteralType:
			return getTextValue(node.literal);
		case SyntaxKind.NumericLiteral:
			return node.text;
		case SyntaxKind.StringLiteral:
			return node.text;
		case SyntaxKind.TrueKeyword:
			return "true";
	}
}

function isLiteralType(node: AST.TypeNode): boolean {
	return (
		node.kind === SyntaxKind.LiteralType &&
		(node.literal.kind === SyntaxKind.StringLiteral ||
			node.literal.kind === SyntaxKind.NumericLiteral ||
			node.literal.kind === SyntaxKind.TrueKeyword ||
			node.literal.kind === SyntaxKind.FalseKeyword)
	);
}

export default ruleCreator.createRule(typescriptLanguage, {
	about: {
		description:
			"Reports using explicit literal types when `as const` can be used.",
		id: "asConstAssertions",
		presets: ["stylistic", "stylisticStrict"],
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
			sourceFile: AST.SourceFile,
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
