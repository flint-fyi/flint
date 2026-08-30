import { SyntaxKind } from "typescript-native/unstable/ast";

import type * as AST from "../types/ast.ts";

export function unwrapParenthesizedNode(node: AST.AnyNode): AST.AnyNode {
	return node.kind === SyntaxKind.ParenthesizedExpression
		? unwrapParenthesizedNode(node.expression as AST.AnyNode)
		: node;
}
