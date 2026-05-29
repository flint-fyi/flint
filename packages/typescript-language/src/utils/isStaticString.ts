import type { AST } from "@flint.fyi/typescript-language";
import { SyntaxKind } from "typescript";

export function isStaticString(node: AST.Expression) {
	return (
		node.kind === SyntaxKind.StringLiteral ||
		node.kind === SyntaxKind.NoSubstitutionTemplateLiteral
	);
}
