import type * as AST from "../types/ast.ts";
import { SyntaxKind } from "../typescript.ts";

export function unwrapParenthesizedNode(node: AST.AnyNode): AST.AnyNode {
	return node.kind === SyntaxKind.ParenthesizedExpression
		? unwrapParenthesizedNode(node.expression)
		: node;
}
