import type { AST } from "@flint.fyi/typescript-language";
import { SyntaxKind } from "typescript";

export function isStaticString(node: AST.Expression) {
	return (
		node.kind === SyntaxKind.StringLiteral ||
		node.kind === SyntaxKind.NoSubstitutionTemplateLiteral
	);
}

export function isStringRawNoSubstitution(
	node: AST.Expression,
): node is AST.TaggedTemplateExpression & {
	template: AST.NoSubstitutionTemplateLiteral;
} {
	if (node.kind !== SyntaxKind.TaggedTemplateExpression) {
		return false;
	}

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
