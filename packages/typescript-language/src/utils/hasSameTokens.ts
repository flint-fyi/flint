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
			visit(child as AST.AnyNode);
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
		case SyntaxKind.HeritageClause:
			return `${String(node.kind)}:${String((node as AST.HeritageClause).token)}`;

		case SyntaxKind.ImportAttributes:
			return `${String(node.kind)}:${String((node as AST.ImportAttributes).token)}`;

		case SyntaxKind.MetaProperty:
			return `${String(node.kind)}:${String((node as AST.MetaProperty).keywordToken)}`;

		case SyntaxKind.ModuleDeclaration:
			return `${String(node.kind)}:${String((node as AST.ModuleDeclaration).keyword)}`;

		case SyntaxKind.PostfixUnaryExpression:
			return `${String(node.kind)}:${String((node as AST.PostfixUnaryExpression).operator)}`;

		case SyntaxKind.PrefixUnaryExpression:
			return `${String(node.kind)}:${String((node as AST.PrefixUnaryExpression).operator)}`;

		case SyntaxKind.TypeOperator:
			return `${String(node.kind)}:${String((node as AST.TypeOperatorNode).operator)}`;

		case SyntaxKind.BigIntLiteral:
		case SyntaxKind.Identifier:
		case SyntaxKind.NoSubstitutionTemplateLiteral:
		case SyntaxKind.NumericLiteral:
		case SyntaxKind.PrivateIdentifier:
		case SyntaxKind.StringLiteral:
			return `${String(node.kind)}:${(node as AST.Identifier).text}`;

		case SyntaxKind.RegularExpressionLiteral:
			return `${String(node.kind)}:${sourceFile.text.slice(node.getStart(sourceFile), node.end)}`;

		default:
			return String(node.kind);
	}
}
