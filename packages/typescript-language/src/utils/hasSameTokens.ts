import { SyntaxKind } from "typescript-native/unstable/ast";

import type * as AST from "../types/ast.ts";
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

function getNodeIdentities(
	node: AST.AnyNode,
	sourceFile: AST.SourceFile,
): string[] {
	const identities: string[] = [];
	function visit(current: AST.AnyNode): void {
		identities.push(getNodeIdentity(current, sourceFile));
		current.forEachChild((child) => {
			visit(child);
		});
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
			return `${String(node.kind)}:${node.text}`;
		case SyntaxKind.HeritageClause:
			return `${String(node.kind)}:${String(node.token)}`;
		case SyntaxKind.Identifier:
			return `${String(node.kind)}:${node.text}`;
		case SyntaxKind.ImportAttributes:
			return `${String(node.kind)}:${String(node.token)}`;
		case SyntaxKind.MetaProperty:
			return `${String(node.kind)}:${String(node.keywordToken)}`;
		case SyntaxKind.ModuleDeclaration:
			return `${String(node.kind)}:${String(node.keyword)}`;
		case SyntaxKind.NoSubstitutionTemplateLiteral:
			return `${String(node.kind)}:${node.text}`;
		case SyntaxKind.NumericLiteral:
			return `${String(node.kind)}:${node.text}`;
		case SyntaxKind.PostfixUnaryExpression:
			return `${String(node.kind)}:${String(node.operator)}`;
		case SyntaxKind.PrefixUnaryExpression:
			return `${String(node.kind)}:${String(node.operator)}`;
		case SyntaxKind.PrivateIdentifier:
			return `${String(node.kind)}:${node.text}`;
		case SyntaxKind.RegularExpressionLiteral:
			return `${String(node.kind)}:${sourceFile.text.slice(node.getStart(sourceFile), node.end)}`;
		case SyntaxKind.StringLiteral:
			return `${String(node.kind)}:${node.text}`;
		case SyntaxKind.TypeOperator:
			return `${String(node.kind)}:${String(node.operator)}`;

		default:
			return String(node.kind);
	}
}
