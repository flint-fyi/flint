import { SyntaxKind } from "typescript";

import type * as AST from "../types/ast.ts";
import { getStaticValue } from "./getStaticValue.ts";

export function getStaticPropertyName(
	node: AST.ElementAccessExpression | AST.PropertyAccessExpression,
) {
	if (node.kind === SyntaxKind.PropertyAccessExpression) {
		return node.name.kind === SyntaxKind.Identifier
			? node.name.text
			: undefined;
	}

	const value = getStaticValue(node.argumentExpression)?.value;

	switch (typeof value) {
		case "bigint":
		case "boolean":
		case "number":
		case "string":
			return String(value);

		default:
			return value === null ? "null" : undefined;
	}
}
