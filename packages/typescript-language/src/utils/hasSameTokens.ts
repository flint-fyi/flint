import { NodeFlags, SyntaxKind } from "typescript-native/ast";

import type * as AST from "../types/ast.ts";
import { forEachChild } from "./forEachChild.ts";
import { unwrapParenthesizedNode } from "./unwrapParenthesizedNode.ts";

export function hasSameTokens(
	nodeA: AST.AnyNode,
	nodeB: AST.AnyNode,
	sourceFile: AST.SourceFile,
): boolean {
	const nodeIdentitiesA = getNodeIdentities(
		unwrapParenthesizedNode(nodeA),
		sourceFile,
	);
	const nodeIdentitiesB = getNodeIdentities(
		unwrapParenthesizedNode(nodeB),
		sourceFile,
	);
	return (
		nodeIdentitiesA.length === nodeIdentitiesB.length &&
		nodeIdentitiesA.every(
			(nodeIdentity, index) => nodeIdentity === nodeIdentitiesB[index],
		)
	);
}

// Marks the end of a node's children, so that structurally different trees
// with the same pre-order node identities don't compare as equal, such as
// f(g(), h()) and f(g(h())). Node identities always start with a numeric
// syntax kind, so this can never collide with one.
const subtreeEnd = ")";

function getNodeIdentities(
	node: AST.AnyNode,
	sourceFile: AST.SourceFile,
): string[] {
	const identities: string[] = [];
	function visit(current: AST.AnyNode): void {
		identities.push(getNodeIdentity(current, sourceFile));
		forEachChild(current, visit);
		identities.push(subtreeEnd);
	}
	visit(node);
	return identities;
}

function getNodeIdentity(
	node: AST.AnyNode,
	sourceFile: AST.SourceFile,
): string {
	switch (node.kind) {
		case SyntaxKind.BigIntLiteral:
		case SyntaxKind.Identifier:
		case SyntaxKind.JsxText:
		case SyntaxKind.NoSubstitutionTemplateLiteral:
		case SyntaxKind.NumericLiteral:
		case SyntaxKind.PrivateIdentifier:
		case SyntaxKind.StringLiteral:
		case SyntaxKind.TemplateHead:
		case SyntaxKind.TemplateMiddle:
		case SyntaxKind.TemplateTail:
			return `${String(node.kind)}:${node.text}`;
		case SyntaxKind.HeritageClause:
		case SyntaxKind.ImportAttributes:
			return `${String(node.kind)}:${String(node.token)}`;
		case SyntaxKind.MetaProperty:
			return `${String(node.kind)}:${String(node.keywordToken)}`;
		case SyntaxKind.ModuleDeclaration:
			return `${String(node.kind)}:${String(node.keyword)}`;
		case SyntaxKind.PostfixUnaryExpression:
		case SyntaxKind.PrefixUnaryExpression:
		case SyntaxKind.TypeOperator:
			return `${String(node.kind)}:${String(node.operator)}`;
		case SyntaxKind.RegularExpressionLiteral:
			return `${String(node.kind)}:${sourceFile.text.slice(node.getStart(sourceFile), node.end)}`;
		case SyntaxKind.VariableDeclarationList:
			return `${String(node.kind)}:${String(node.flags & NodeFlags.BlockScoped)}`;

		default:
			return String(node.kind);
	}
}
