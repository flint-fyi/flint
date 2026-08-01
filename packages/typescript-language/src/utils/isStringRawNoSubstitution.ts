import { SyntaxKind } from "typescript";

import type { AST } from "@flint.fyi/typescript-language";

export interface StringRawNoSubstitution extends AST.TaggedTemplateExpression {
	template: AST.NoSubstitutionTemplateLiteral;
}

export function isStringRawNoSubstitution(
	node: AST.Expression,
): node is StringRawNoSubstitution {
	if (node.kind !== SyntaxKind.TaggedTemplateExpression) {
		return false;
	}

	// TODO: Name-based only; not type-aware about a shadowed `String`.
	const tag = node.tag;
	return (
		tag.kind === SyntaxKind.PropertyAccessExpression &&
		tag.expression.kind === SyntaxKind.Identifier &&
		tag.expression.text === "String" &&
		tag.name.kind === SyntaxKind.Identifier &&
		tag.name.text === "raw" &&
		node.template.kind === SyntaxKind.NoSubstitutionTemplateLiteral
	);
}
