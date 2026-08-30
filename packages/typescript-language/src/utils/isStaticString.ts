import { SyntaxKind } from "typescript-native/unstable/ast";

import type { AST } from "@flint.fyi/typescript-language";

export type StaticString =
	| AST.NoSubstitutionTemplateLiteral
	| AST.StringLiteral;

export function isStaticString(node: AST.Expression): node is StaticString {
	return (
		node.kind === SyntaxKind.StringLiteral ||
		node.kind === SyntaxKind.NoSubstitutionTemplateLiteral
	);
}
