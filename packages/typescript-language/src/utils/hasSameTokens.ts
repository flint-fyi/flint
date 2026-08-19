import type ts from "typescript";

import type * as AST from "../types/ast.ts";
import typescript, { SyntaxKind } from "../typescript.ts";
import { unwrapParenthesizedNode } from "./unwrapParenthesizedNode.ts";

export function hasSameTokens(
	nodeA: AST.AnyNode,
	nodeB: AST.AnyNode,
	sourceFile: AST.SourceFile,
): boolean {
	const queueA: ts.Node[] = [unwrapParenthesizedNode(nodeA)];
	const queueB: ts.Node[] = [unwrapParenthesizedNode(nodeB)];

	while (true) {
		const currentA = queueA.shift();
		const currentB = queueB.shift();

		if (!currentA || !currentB) {
			break;
		}

		if (currentA.kind !== currentB.kind) {
			return false;
		}

		if (typescript.isTokenKind(currentA.kind)) {
			if (!areSameToken(currentA, currentB, sourceFile)) {
				return false;
			}
			continue;
		}

		const childrenA = currentA.getChildren(sourceFile);
		const childrenB = currentB.getChildren(sourceFile);

		if (childrenA.length !== childrenB.length) {
			return false;
		}

		queueA.push(...childrenA);
		queueB.push(...childrenB);
	}

	return queueA.length === queueB.length;
}

function areSameToken(
	nodeA: ts.Node,
	nodeB: ts.Node,
	sourceFile: AST.SourceFile,
): boolean {
	if (
		typescript.isIdentifier(nodeA) ||
		typescript.isPrivateIdentifier(nodeA) ||
		typescript.isNumericLiteral(nodeA) ||
		typescript.isBigIntLiteral(nodeA) ||
		typescript.isStringLiteral(nodeA) ||
		typescript.isNoSubstitutionTemplateLiteral(nodeA)
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
