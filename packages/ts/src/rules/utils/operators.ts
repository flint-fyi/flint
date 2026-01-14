import { SyntaxKind } from "typescript";

import * as AST from "../../types/ast.ts";

export function isComparisonOperator(token: AST.BinaryOperatorToken) {
	switch (token.kind) {
		case SyntaxKind.EqualsEqualsEqualsToken:
		case SyntaxKind.EqualsEqualsToken:
		case SyntaxKind.ExclamationEqualsEqualsToken:
		case SyntaxKind.ExclamationEqualsToken:
		case SyntaxKind.GreaterThanEqualsToken:
		case SyntaxKind.GreaterThanToken:
		case SyntaxKind.LessThanEqualsToken:
		case SyntaxKind.LessThanToken:
			return true;
		default:
			return false;
	}
}

export function isEqualityOperator(token: AST.BinaryOperatorToken) {
	switch (token.kind) {
		case SyntaxKind.EqualsEqualsEqualsToken:
		case SyntaxKind.EqualsEqualsToken:
		case SyntaxKind.ExclamationEqualsEqualsToken:
		case SyntaxKind.ExclamationEqualsToken:
			return true;
		default:
			return false;
	}
}

export function isNegatedEqualityOperator(token: AST.BinaryOperatorToken) {
	switch (token.kind) {
		case SyntaxKind.ExclamationEqualsEqualsToken:
		case SyntaxKind.ExclamationEqualsToken:
			return true;
		default:
			return false;
	}
}
