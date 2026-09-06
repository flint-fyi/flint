import { SyntaxKind } from "typescript-native/unstable/ast";

import {
	isStaticString,
	isStringRawNoSubstitution,
	type AST,
	type StaticString,
	type StringRawNoSubstitution,
} from "@flint.fyi/typescript-language";

import { findProperty } from "./findProperty.ts";
import { tsAstToLiteral } from "./tsAstToLiteral.ts";
import type {
	ParsedTestCase,
	ParsedTestCaseCodeNode,
	ParsedTestCaseInvalid,
} from "./types.ts";

export function parseTestCase(
	node: AST.Expression,
): ParsedTestCase | undefined {
	if (isTestCaseCode(node)) {
		return {
			code: getTestCaseCode(node),
			nodes: {
				case: node,
				code: node,
			},
		};
	}

	if (node.kind !== SyntaxKind.ObjectLiteralExpression) {
		return;
	}

	const code = findProperty(node.properties, "code", isTestCaseCode);
	if (!code) {
		return;
	}

	const fileName = findProperty(node.properties, "fileName", isStaticString);
	const files = findProperty(
		node.properties,
		"files",
		(node) => node.kind === SyntaxKind.ObjectLiteralExpression,
	);
	const name = findProperty(node.properties, "name", isStaticString);
	const options = findProperty(
		node.properties,
		"options",
		(node) => node.kind === SyntaxKind.ObjectLiteralExpression,
	);

	return {
		code: getTestCaseCode(code),
		fileName: fileName?.text,
		files: files && (tsAstToLiteral(files) as Record<string, string>),
		name: name?.text,
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
		return;
	}

	const code = findProperty(node.properties, "code", isTestCaseCode);
	if (!code) {
		return;
	}

	const fileName = findProperty(node.properties, "fileName", isStaticString);
	const files = findProperty(
		node.properties,
		"files",
		(node) => node.kind === SyntaxKind.ObjectLiteralExpression,
	);
	const name = findProperty(node.properties, "name", isStaticString);
	const options = findProperty(
		node.properties,
		"options",
		(node) => node.kind === SyntaxKind.ObjectLiteralExpression,
	);
	const snapshot = findProperty(node.properties, "snapshot", isStaticString);
	if (!snapshot) {
		return;
	}

	return {
		code: getTestCaseCode(code),
		fileName: fileName?.text,
		files: files && (tsAstToLiteral(files) as Record<string, string>),
		name: name?.text,
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
		snapshot: snapshot.text,
	};
}

function getTestCaseCode(node: ParsedTestCaseCodeNode) {
	if (isStringRawNoSubstitution(node)) {
		return node.template.getText().slice(1, -1);
	}

	return node.text;
}

function isTestCaseCode(
	node: AST.Expression,
): node is StaticString | StringRawNoSubstitution {
	return isStaticString(node) || isStringRawNoSubstitution(node);
}
