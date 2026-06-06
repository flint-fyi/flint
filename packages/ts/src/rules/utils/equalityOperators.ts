import { SyntaxKind } from "typescript";

import {
	unwrapParenthesizedNode,
	type AST,
} from "@flint.fyi/typescript-language";

export type EqualityOperator = "!=" | "!==" | "==" | "===";

export function isNullishLiteral(node: AST.Expression): boolean {
	return isNullLiteral(node) || isUndefinedIdentifier(node);
}

export function isUndefinedIdentifier(node: AST.Expression): boolean {
	const unwrapped = unwrapParenthesizedNode(node);
	return (
		unwrapped.kind === SyntaxKind.Identifier && unwrapped.text === "undefined"
	);
}

export function toEqualityOperator(
	kind: SyntaxKind,
): EqualityOperator | undefined {
	switch (kind) {
		case SyntaxKind.EqualsEqualsEqualsToken:
			return "===";
		case SyntaxKind.EqualsEqualsToken:
			return "==";
		case SyntaxKind.ExclamationEqualsEqualsToken:
			return "!==";
		case SyntaxKind.ExclamationEqualsToken:
			return "!=";
		default:
			return undefined;
	}
}

export function toLooseOperator(operator: EqualityOperator): EqualityOperator {
	if (operator === "===") {
		return "==";
	}
	if (operator === "!==") {
		return "!=";
	}
	return operator;
}

export function toStrictOperator(operator: EqualityOperator): EqualityOperator {
	if (operator === "==") {
		return "===";
	}
	if (operator === "!=") {
		return "!==";
	}
	return operator;
}

function isNullLiteral(node: AST.Expression): boolean {
	const unwrapped = unwrapParenthesizedNode(node);
	return unwrapped.kind === SyntaxKind.NullKeyword;
}
