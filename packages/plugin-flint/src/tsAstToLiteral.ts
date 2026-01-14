// Fork of ts-ast-to-literal pending:
// https://github.com/dword-design/ts-ast-to-literal/issues/89

// Changing from the switch to manual ifs is due to:
// https://github.com/Microsoft/TypeScript/issues/56275

import type { AST } from "@flint.fyi/ts";
import ts, { SyntaxKind } from "typescript";

export function tsAstToLiteral(node: AST.ArrayLiteralExpression): unknown[];
export function tsAstToLiteral(node: AST.ObjectLiteralExpression): object;
export function tsAstToLiteral(node: ts.Node): unknown;
export function tsAstToLiteral(node: ts.Node): unknown {
	switch (node.kind) {
		case SyntaxKind.FalseKeyword:
			return false;
		case SyntaxKind.NullKeyword:
			return null;
		case SyntaxKind.TrueKeyword:
			return true;
	}

	if (ts.isArrayLiteralExpression(node)) {
		return node.elements
			.filter((element) => element.kind !== SyntaxKind.SpreadElement)
			.map((element) => tsAstToLiteral(element));
	}

	if (ts.isNumericLiteral(node)) {
		return parseFloat(node.text);
	}

	if (ts.isObjectLiteralExpression(node)) {
		return Object.fromEntries(
			node.properties
				.filter(
					(
						property,
					): property is ts.PropertyAssignment & { name: ts.Identifier } =>
						ts.isPropertyAssignment(property) &&
						(property.name.kind === SyntaxKind.Identifier ||
							property.name.kind === SyntaxKind.StringLiteral),
				)
				.map((property) => [
					property.name.escapedText || property.name.text,
					tsAstToLiteral(property.initializer),
				]),
		);
	}

	if (ts.isStringLiteral(node)) {
		return node.text;
	}

	return undefined;
}
