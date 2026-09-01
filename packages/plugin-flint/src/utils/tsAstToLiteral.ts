// Fork of ts-ast-to-literal pending:
// https://github.com/dword-design/ts-ast-to-literal/issues/89

// Changing from the switch to manual ifs is due to:
// https://github.com/Microsoft/TypeScript/issues/56275

import {
	isArrayLiteralExpression,
	isIdentifier,
	isNumericLiteral,
	isObjectLiteralExpression,
	isPropertyAssignment,
	isSpreadElement,
	isStringLiteral,
	SyntaxKind,
	type Node,
} from "typescript-native/unstable/ast";

import type { AST } from "@flint.fyi/typescript-language";

export function tsAstToLiteral(node: AST.ArrayLiteralExpression): unknown[];
export function tsAstToLiteral(node: AST.ObjectLiteralExpression): object;
export function tsAstToLiteral(node: Node): unknown;
export function tsAstToLiteral(node: Node): unknown {
	switch (node.kind) {
		case SyntaxKind.FalseKeyword:
			return false;
		case SyntaxKind.NullKeyword:
			return null;
		case SyntaxKind.TrueKeyword:
			return true;
	}

	if (isArrayLiteralExpression(node)) {
		return node.elements
			.filter((element) => !isSpreadElement(element))
			.map((element) => tsAstToLiteral(element));
	}

	if (isNumericLiteral(node)) {
		return parseFloat(node.text);
	}

	if (isObjectLiteralExpression(node)) {
		return Object.fromEntries(
			node.properties.filter(isPropertyAssignment).flatMap((property) => {
				if (!isIdentifier(property.name) && !isStringLiteral(property.name)) {
					return [];
				}

				return [[property.name.text, tsAstToLiteral(property.initializer)]];
			}),
		);
	}

	if (isStringLiteral(node)) {
		return node.text;
	}

	return undefined;
}
