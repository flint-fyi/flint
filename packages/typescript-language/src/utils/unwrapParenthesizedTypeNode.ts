import { SyntaxKind } from "typescript";

import type * as AST from "../types/ast.ts";

export function unwrapParenthesizedTypeNode(
	type: AST.TypeNode,
): Exclude<AST.TypeNode, AST.ParenthesizedTypeNode> {
	return type.kind === SyntaxKind.ParenthesizedType
		? unwrapParenthesizedTypeNode(type.type)
		: type;
}
