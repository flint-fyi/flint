import { SyntaxKind } from "typescript";

import type * as AST from "../types/ast.ts";

export function unwrapParenthesizedNode(node: AST.AnyNode): AST.AnyNode {
	return node.kind === SyntaxKind.ParenthesizedExpression
		? unwrapParenthesizedNode(node.expression)
		: node;
}
