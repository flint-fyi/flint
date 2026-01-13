import ts from "typescript";

import type { AST } from "../index.ts";
import { unwrapParenthesizedExpression } from "./unwrapParenthesizedExpression.ts";

export function hasSameTokens(
	nodeA: AST.Expression,
	nodeB: AST.Expression,
	sourceFile: ts.SourceFile,
): boolean {
	const queueA: ts.Node[] = [unwrapParenthesizedExpression(nodeA)];
	const queueB: ts.Node[] = [unwrapParenthesizedExpression(nodeB)];

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
	sourceFile: ts.SourceFile,
): boolean {
	if (
		ts.isIdentifier(nodeA) ||
		ts.isPrivateIdentifier(nodeA) ||
		ts.isNumericLiteral(nodeA) ||
		ts.isBigIntLiteral(nodeA) ||
		ts.isStringLiteral(nodeA) ||
		ts.isNoSubstitutionTemplateLiteral(nodeA)
	) {
		return nodeA.text === (nodeB as typeof nodeA).text;
	}

	if (nodeA.kind === ts.SyntaxKind.RegularExpressionLiteral) {
		return (
			sourceFile.text.slice(nodeA.getStart(sourceFile), nodeA.getEnd()) ===
			sourceFile.text.slice(nodeB.getStart(sourceFile), nodeB.getEnd())
		);
	}

	return true;
}
