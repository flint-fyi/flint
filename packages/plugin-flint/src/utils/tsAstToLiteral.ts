// Fork of ts-ast-to-literal pending:
// https://github.com/dword-design/ts-ast-to-literal/issues/89

// Changing from the switch to manual ifs is due to:
// https://github.com/Microsoft/TypeScript/issues/56275

import { SyntaxKind } from "typescript-native/unstable/ast";

import type { AST } from "@flint.fyi/typescript-language";

export function tsAstToLiteral(node: AST.ArrayLiteralExpression): unknown[];
export function tsAstToLiteral(node: AST.ObjectLiteralExpression): object;
export function tsAstToLiteral(node: AST.Node): unknown;
export function tsAstToLiteral(node: AST.Node): unknown {
	switch (node.kind) {
		case SyntaxKind.FalseKeyword:
			return false;
		case SyntaxKind.NullKeyword:
			return null;
		case SyntaxKind.TrueKeyword:
			return true;
	}

	if (node.kind === SyntaxKind.ArrayLiteralExpression) {
		return node.elements
			.filter((element) => element.kind !== SyntaxKind.SpreadElement)
			.map((element) => tsAstToLiteral(element));
	}

	if (node.kind === SyntaxKind.NumericLiteral) {
		return parseFloat(node.text);
	}

	if (node.kind === SyntaxKind.ObjectLiteralExpression) {
		return Object.fromEntries(
			node.properties
				.filter(
					(property): property is AST.PropertyAssignment =>
						property.kind === SyntaxKind.PropertyAssignment,
				)
				.flatMap((property) => {
					if (
						property.name.kind !== SyntaxKind.Identifier &&
						property.name.kind !== SyntaxKind.StringLiteral
					) {
						return [];
					}

					return [[property.name.text, tsAstToLiteral(property.initializer)]];
				}),
		);
	}

	if (node.kind === SyntaxKind.StringLiteral) {
		return node.text;
	}

	return undefined;
}
