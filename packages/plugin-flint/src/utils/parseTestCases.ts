import type { AST } from "@flint.fyi/typescript-language";
import { SyntaxKind } from "typescript";

import { findProperty } from "./findProperty.ts";
import { tsAstToLiteral } from "./tsAstToLiteral.ts";
import type { ParsedTestCase, ParsedTestCaseInvalid } from "./types.ts";

function isStringRawNoSubstitution(
	node: AST.Expression,
): node is AST.TaggedTemplateExpression & {
	template: AST.NoSubstitutionTemplateLiteral;
} {
	return (
		node.kind === SyntaxKind.TaggedTemplateExpression &&
		node.tag.kind === SyntaxKind.PropertyAccessExpression &&
		node.tag.expression.kind === SyntaxKind.Identifier &&
		node.tag.expression.text === "String" &&
		node.tag.name.kind === SyntaxKind.Identifier &&
		node.tag.name.text === "raw" &&
		node.template.kind === SyntaxKind.NoSubstitutionTemplateLiteral
	);
}

function isStaticCodeNode(node: AST.Expression): node is
	| AST.StringLiteral
	| AST.NoSubstitutionTemplateLiteral
	| (AST.TaggedTemplateExpression & {
			template: AST.NoSubstitutionTemplateLiteral;
	  }) {
	return (
		node.kind === SyntaxKind.StringLiteral ||
		node.kind === SyntaxKind.NoSubstitutionTemplateLiteral ||
		isStringRawNoSubstitution(node)
	);
}

function getCodeText(
	node:
		| AST.StringLiteral
		| AST.NoSubstitutionTemplateLiteral
		| (AST.TaggedTemplateExpression & {
				template: AST.NoSubstitutionTemplateLiteral;
		  }),
): string {
	if (node.kind === SyntaxKind.TaggedTemplateExpression) {
		return node.template.text;
	}

	return node.text;
}

export function parseTestCase(
	node: AST.Expression,
): ParsedTestCase | undefined {
	if (isStaticCodeNode(node)) {
		return {
			code: getCodeText(node),
			nodes: {
				case: node,
				code: node,
			},
		};
	}

	if (node.kind !== SyntaxKind.ObjectLiteralExpression) {
		return undefined;
	}

	const code = findProperty(node.properties, "code", isStaticCodeNode);
	if (!code) {
		return undefined;
	}

	const fileName = findProperty(node.properties, "fileName", isStaticCodeNode);
	const files = findProperty(
		node.properties,
		"files",
		(node) => node.kind === SyntaxKind.ObjectLiteralExpression,
	);
	const name = findProperty(node.properties, "name", isStaticCodeNode);
	const options = findProperty(
		node.properties,
		"options",
		(node) => node.kind === SyntaxKind.ObjectLiteralExpression,
	);

	return {
		code: getCodeText(code),
		fileName: fileName && getCodeText(fileName),
		files: files && (tsAstToLiteral(files) as Record<string, string>),
		name: name && getCodeText(name),
		nodes: {
			case: node,
			code,
			fileName,
			files,
			name,
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

	const code = findProperty(node.properties, "code", isStaticCodeNode);
	if (!code) {
		return undefined;
	}

	const fileName = findProperty(node.properties, "fileName", isStaticCodeNode);
	const files = findProperty(
		node.properties,
		"files",
		(node) => node.kind === SyntaxKind.ObjectLiteralExpression,
	);
	const name = findProperty(node.properties, "name", isStaticCodeNode);
	const options = findProperty(
		node.properties,
		"options",
		(node) => node.kind === SyntaxKind.ObjectLiteralExpression,
	);
	const snapshot = findProperty(node.properties, "snapshot", isStaticCodeNode);
	if (!snapshot) {
		return undefined;
	}

	return {
		code: getCodeText(code),
		fileName: fileName && getCodeText(fileName),
		files: files && (tsAstToLiteral(files) as Record<string, string>),
		name: name && getCodeText(name),
		nodes: {
			case: node,
			code,
			fileName,
			files,
			name,
			options,
			snapshot,
		},
		options: options && tsAstToLiteral(options),
		snapshot: getCodeText(snapshot),
	};
}
