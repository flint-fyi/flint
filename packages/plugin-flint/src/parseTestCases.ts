import type { AST } from "@flint.fyi/ts";
import { SyntaxKind } from "typescript";

import { findProperty } from "./findProperty.ts";
import { tsAstToLiteral } from "./tsAstToLiteral.ts";
import type { ParsedTestCase, ParsedTestCaseInvalid } from "./types.ts";

export function parseTestCase(
	node: AST.Expression,
): ParsedTestCase | undefined {
	if (
		node.kind == SyntaxKind.StringLiteral ||
		node.kind == SyntaxKind.NoSubstitutionTemplateLiteral
	) {
		return {
			code: node.text,
			nodes: {
				case: node,
				code: node,
			},
		};
	}

	if (node.kind != SyntaxKind.ObjectLiteralExpression) {
		return undefined;
	}

	const code = findProperty(
		node.properties,
		"code",

		(node) =>
			node.kind == SyntaxKind.StringLiteral ||
			node.kind == SyntaxKind.NoSubstitutionTemplateLiteral,
	);
	if (!code) {
		return undefined;
	}

	const fileName = findProperty(
		node.properties,
		"fileName",
		(node) =>
			node.kind == SyntaxKind.StringLiteral ||
			node.kind == SyntaxKind.NoSubstitutionTemplateLiteral,
	);
	const options = findProperty(
		node.properties,
		"options",
		(node) => node.kind == SyntaxKind.ObjectLiteralExpression,
	);

	return {
		code: code.text,
		fileName: fileName?.text,
		nodes: {
			case: node,
			code,
			fileName,
			options,
		},
		options: options && tsAstToLiteral(options),
	};
}

export function parseTestCaseInvalid(
	node: AST.Expression,
): ParsedTestCaseInvalid | undefined {
	if (node.kind !== SyntaxKind.ObjectLiteralExpression) {
		return undefined;
	}

	const code = findProperty(
		node.properties,
		"code",
		(node) =>
			node.kind == SyntaxKind.StringLiteral ||
			node.kind == SyntaxKind.NoSubstitutionTemplateLiteral,
	);
	if (!code) {
		return undefined;
	}

	const fileName = findProperty(
		node.properties,
		"fileName",
		(node) =>
			node.kind == SyntaxKind.StringLiteral ||
			node.kind == SyntaxKind.NoSubstitutionTemplateLiteral,
	);
	const options = findProperty(
		node.properties,
		"options",
		(node) => node.kind == SyntaxKind.ObjectLiteralExpression,
	);
	const snapshot = findProperty(
		node.properties,
		"snapshot",
		(node) =>
			node.kind == SyntaxKind.StringLiteral ||
			node.kind == SyntaxKind.NoSubstitutionTemplateLiteral,
	);
	if (!snapshot) {
		return undefined;
	}

	return {
		code: code.text,
		fileName: fileName?.text,
		nodes: {
			case: node,
			code,
			fileName,
			options,
			snapshot,
		},
		options: options && tsAstToLiteral(options),
		snapshot: snapshot.text,
	};
}
