import type { AST } from "@flint.fyi/typescript-language";

import { SyntaxKind } from "../typescript.ts";

export type StaticString =
	| AST.NoSubstitutionTemplateLiteral
	| AST.StringLiteral;

export function isStaticString(node: AST.Expression): node is StaticString {
	return (
		node.kind === SyntaxKind.StringLiteral ||
		node.kind === SyntaxKind.NoSubstitutionTemplateLiteral
	);
}
