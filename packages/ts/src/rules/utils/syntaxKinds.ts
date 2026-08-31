import { SyntaxKind } from "typescript-native/unstable/ast";

import type { AST } from "@flint.fyi/typescript-language";

export function isAssignmentKind(kind: SyntaxKind): boolean {
	switch (kind) {
		case SyntaxKind.AmpersandAmpersandEqualsToken:
		case SyntaxKind.AmpersandEqualsToken:
		case SyntaxKind.AsteriskAsteriskEqualsToken:
		case SyntaxKind.AsteriskEqualsToken:
		case SyntaxKind.BarBarEqualsToken:
		case SyntaxKind.BarEqualsToken:
		case SyntaxKind.CaretEqualsToken:
		case SyntaxKind.EqualsToken:
		case SyntaxKind.GreaterThanGreaterThanEqualsToken:
		case SyntaxKind.GreaterThanGreaterThanGreaterThanEqualsToken:
		case SyntaxKind.LessThanLessThanEqualsToken:
		case SyntaxKind.MinusEqualsToken:
		case SyntaxKind.PercentEqualsToken:
		case SyntaxKind.PlusEqualsToken:
		case SyntaxKind.QuestionQuestionEqualsToken:
		case SyntaxKind.SlashEqualsToken:
			return true;
		default:
			return false;
	}
}

export function isFunctionScopeBoundary(node: AST.AnyNode): boolean {
	switch (node.kind) {
		case SyntaxKind.ArrowFunction:
		case SyntaxKind.Constructor:
		case SyntaxKind.FunctionDeclaration:
		case SyntaxKind.FunctionExpression:
		case SyntaxKind.GetAccessor:
		case SyntaxKind.MethodDeclaration:
		case SyntaxKind.SetAccessor:
			return true;
		default:
			return false;
	}
}
