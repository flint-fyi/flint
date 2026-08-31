import { SyntaxKind } from "typescript";

import type * as AST from "../types/ast.ts";
import { unwrapParenthesizedNode } from "./unwrapParenthesizedNode.ts";

export interface StaticValue {
	value: unknown;
}

export function getStaticNumberValue(node: AST.Expression): number | undefined {
	const value = getStaticValue(node)?.value;
	return typeof value === "number" ? value : undefined;
}

export function getStaticStringValue(node: AST.Expression): string | undefined {
	const value = getStaticValue(node)?.value;
	return typeof value === "string" ? value : undefined;
}

export function getStaticValue(node: AST.Expression): StaticValue | undefined {
	const unwrapped = unwrapParenthesizedNode(node);

	switch (unwrapped.kind) {
		case SyntaxKind.AsExpression:
		case SyntaxKind.NonNullExpression:
		case SyntaxKind.SatisfiesExpression:
		case SyntaxKind.TypeAssertionExpression:
			return getStaticValue(unwrapped.expression);

		case SyntaxKind.BigIntLiteral:
			return { value: BigInt(unwrapped.text.slice(0, -1)) };

		case SyntaxKind.FalseKeyword:
			return { value: false };

		case SyntaxKind.NoSubstitutionTemplateLiteral:
			return { value: unwrapped.text };

		case SyntaxKind.NullKeyword:
			return { value: null };

		case SyntaxKind.NumericLiteral:
			return { value: Number(unwrapped.text) };

		case SyntaxKind.PrefixUnaryExpression:
			return getPrefixUnaryStaticValue(unwrapped);

		case SyntaxKind.StringLiteral:
			return { value: unwrapped.text };

		case SyntaxKind.TrueKeyword:
			return { value: true };
	}
}

function getPrefixUnaryStaticValue(
	node: AST.PrefixUnaryExpression,
): StaticValue | undefined {
	const operand = getStaticValue(node.operand);
	if (!operand) {
		return undefined;
	}

	switch (node.operator) {
		case SyntaxKind.ExclamationToken:
			return { value: !operand.value };

		case SyntaxKind.MinusToken:
			if (
				typeof operand.value === "bigint" ||
				typeof operand.value === "number"
			) {
				return { value: -operand.value };
			}
			return undefined;

		case SyntaxKind.PlusToken:
			return typeof operand.value === "number"
				? { value: operand.value }
				: undefined;

		case SyntaxKind.TildeToken:
			if (
				typeof operand.value === "bigint" ||
				typeof operand.value === "number"
			) {
				return { value: ~operand.value };
			}
	}
}
