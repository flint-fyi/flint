import { SyntaxKind } from "typescript";

import type { AST } from "@flint.fyi/typescript-language";

export function isStaticString(
	node: AST.Expression,
): node is AST.NoSubstitutionTemplateLiteral | AST.StringLiteral {
	return (
		node.kind === SyntaxKind.StringLiteral ||
		node.kind === SyntaxKind.NoSubstitutionTemplateLiteral
	);
}
