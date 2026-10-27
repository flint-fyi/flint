import ts, { SyntaxKind } from "typescript";

import type * as AST from "../types/ast.ts";
import { unwrapParenthesizedNode } from "./unwrapParenthesizedNode.ts";

export function hasSameTokens(
	nodeA: AST.AnyNode,
	nodeB: AST.AnyNode,
	sourceFile: AST.SourceFile,
): boolean {
	const queueA: AST.AnyNode[] = [unwrapParenthesizedNode(nodeA)];
	const queueB: AST.AnyNode[] = [unwrapParenthesizedNode(nodeB)];

	while (true) {
		const currentA = queueA.shift();
		const currentB = queueB.shift();

		if (!currentA || !currentB) {
			break;
		}

		if (currentA.kind !== currentB.kind) {
			return false;
		}

		if (ts.isTokenKind(currentA.kind)) {
			if (!areSameToken(currentA, currentB, sourceFile)) {
				return false;
			}
			continue;
		}

		const childrenA = currentA.getChildren(sourceFile) as AST.AnyNode[];
		const childrenB = currentB.getChildren(sourceFile) as AST.AnyNode[];

		if (childrenA.length !== childrenB.length) {
			return false;
		}

		queueA.push(...childrenA);
		queueB.push(...childrenB);
	}

	return queueA.length === queueB.length;
}

function areSameToken(
	nodeA: AST.AnyNode,
	nodeB: AST.AnyNode,
	sourceFile: AST.SourceFile,
): boolean {
	if (
		nodeA.kind === SyntaxKind.Identifier ||
		nodeA.kind === SyntaxKind.PrivateIdentifier ||
		nodeA.kind === SyntaxKind.NumericLiteral ||
		nodeA.kind === SyntaxKind.BigIntLiteral ||
		nodeA.kind === SyntaxKind.StringLiteral ||
		nodeA.kind === SyntaxKind.NoSubstitutionTemplateLiteral
	) {
		return nodeA.text === (nodeB as typeof nodeA).text;
	}

	if (nodeA.kind === SyntaxKind.RegularExpressionLiteral) {
		return (
			sourceFile.text.slice(nodeA.getStart(sourceFile), nodeA.getEnd()) ===
			sourceFile.text.slice(nodeB.getStart(sourceFile), nodeB.getEnd())
		);
	}

	return true;
}
