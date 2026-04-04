import type { AST } from "@flint.fyi/typescript-language";
import { SyntaxKind } from "typescript";

import { findProperty } from "./findProperty.ts";

export function getRuleTesterCaseArrays(node: AST.CallExpression) {
	if (
		node.expression.kind !== SyntaxKind.PropertyAccessExpression ||
		node.expression.expression.kind !== SyntaxKind.Identifier ||
		node.expression.name.kind !== SyntaxKind.Identifier ||
		node.expression.name.text !== "describe" ||
		node.arguments.length !== 2
	) {
		return undefined;
	}

	// TODO: Check node.expression.expression's type for being a RuleTester
	// https://github.com/flint-fyi/flint/issues/152

	const argument = node.arguments[1];
	if (argument?.kind !== SyntaxKind.ObjectLiteralExpression) {
		return undefined;
	}

	const valid = findProperty(
		argument.properties,
		"valid",
		(node): node is AST.ArrayLiteralExpression =>
			node.kind === SyntaxKind.ArrayLiteralExpression,
	);

	const invalid = findProperty(
		argument.properties,
		"invalid",
		(node): node is AST.ArrayLiteralExpression =>
			node.kind === SyntaxKind.ArrayLiteralExpression,
	);

	if (!valid || !invalid) {
		return undefined;
	}

	return { invalid, valid };
}
