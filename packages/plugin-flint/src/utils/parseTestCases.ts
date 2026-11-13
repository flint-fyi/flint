import { SyntaxKind } from "typescript";

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
			nodes: { case: node, code: node },
		};
	}

	if (node.kind !== SyntaxKind.ObjectLiteralExpression) {
		return;
	}

	const code = findProperty(node.properties, "code", isTestCaseCode);
	if (
		!code &&
		node.properties.some(
			(property) =>
				property.kind === SyntaxKind.SpreadAssignment ||
				((property.name.kind === SyntaxKind.Identifier ||
					property.name.kind === SyntaxKind.StringLiteral) &&
					property.name.text === "code"),
		)
	) {
		return;
	}
	const files = findProperty(
		node.properties,
		"files",
		(node) => node.kind === SyntaxKind.ObjectLiteralExpression,
	);
	const parsedFiles = files && parseCodeMap(files);
	if (!code && !parsedFiles) {
		return;
	}

	const name = findProperty(node.properties, "name", isStaticString);
	const options = findProperty(
		node.properties,
		"options",
		(node) => node.kind === SyntaxKind.ObjectLiteralExpression,
	);
	const shared = {
		name: name?.text,
		nodes: {
			case: node,
			code,
			fileCodes: parsedFiles?.nodes,
			files,
			name,
			options,
		},
		options: options && tsAstToLiteral(options),
	};

	if (code) {
		return {
			...shared,
			code: getTestCaseCode(code),
			files:
				parsedFiles?.values ??
				(files && (tsAstToLiteral(files) as Record<string, string>)),
		};
	}

	return parsedFiles && { ...shared, files: parsedFiles.values };
}

export function parseTestCaseInvalid(
	node: AST.Expression,
): ParsedTestCaseInvalid | undefined {
	if (node.kind !== SyntaxKind.ObjectLiteralExpression) {
		return;
	}

	const testCase = parseTestCase(node);
	const snapshot = findProperty(
		node.properties,
		"snapshot",
		(node) =>
			isTestCaseCode(node) || node.kind === SyntaxKind.ObjectLiteralExpression,
	);
	if (!testCase || !snapshot) {
		return;
	}

	if (isTestCaseCode(snapshot)) {
		return {
			...testCase,
			nodes: { ...testCase.nodes, snapshot },
			snapshot: getTestCaseCode(snapshot),
		};
	}

	const snapshotFiles = parseCodeMap(snapshot);
	if (!snapshotFiles) {
		return;
	}

	return {
		...testCase,
		nodes: {
			...testCase.nodes,
			snapshot,
			snapshotFiles: snapshotFiles.nodes,
		},
		snapshot: snapshotFiles.values,
	};
}

function getTestCaseCode(node: ParsedTestCaseCodeNode): string {
	if (isStringRawNoSubstitution(node)) {
		return node.template.rawText ?? node.template.text;
	}

	return node.text;
}

function isTestCaseCode(
	node: AST.Expression,
): node is StaticString | StringRawNoSubstitution {
	return isStaticString(node) || isStringRawNoSubstitution(node);
}

function parseCodeMap(node: AST.ObjectLiteralExpression):
	| undefined
	| {
			nodes: Record<string, ParsedTestCaseCodeNode>;
			values: Record<string, string>;
	  } {
	const entries: [string, ParsedTestCaseCodeNode][] = [];
	for (const property of node.properties) {
		if (
			property.kind !== SyntaxKind.PropertyAssignment ||
			(property.name.kind !== SyntaxKind.Identifier &&
				property.name.kind !== SyntaxKind.StringLiteral) ||
			!isTestCaseCode(property.initializer)
		) {
			return;
		}
		entries.push([property.name.text, property.initializer]);
	}

	return {
		nodes: Object.fromEntries(entries),
		values: Object.fromEntries(
			entries.map(([name, code]) => [name, getTestCaseCode(code)]),
		),
	};
}
