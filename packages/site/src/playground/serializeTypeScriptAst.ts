import {
	forEachChild,
	isIdentifier,
	isLiteralExpression,
	isPrivateIdentifier,
	isTemplateLiteralToken,
	SyntaxKind,
	type Node,
	type NodeArray,
	type SourceFile,
} from "typescript";

import type { PlaygroundAstNode } from "./types.ts";

const syntaxKindNames = new Map<number, string>();

// SyntaxKind includes marker aliases such as FirstStatement that share values
// with real kinds, so only the first name declared for each value is kept.
for (const [name, value] of Object.entries(SyntaxKind)) {
	if (typeof value === "number" && !syntaxKindNames.has(value)) {
		syntaxKindNames.set(value, name);
	}
}

export function serializeTypeScriptAst(
	node: Node,
	sourceFile: SourceFile,
): PlaygroundAstNode {
	const childNodes = new Set<unknown>();
	const childNodeArrays = new Set<unknown>();

	forEachChild(
		node,
		(child) => {
			childNodes.add(child);
		},
		(children) => {
			childNodeArrays.add(children);
		},
	);

	const properties: PlaygroundAstNode["properties"] = {};

	for (const [key, value] of Object.entries(node) as [string, unknown][]) {
		if (childNodeArrays.has(value)) {
			properties[key] = (value as NodeArray<Node>).map((child) =>
				serializeTypeScriptAst(child, sourceFile),
			);
		} else if (childNodes.has(value)) {
			properties[key] = serializeTypeScriptAst(value as Node, sourceFile);
		}
	}

	return {
		end: node.getEnd(),
		kind: syntaxKindNames.get(node.kind) ?? String(node.kind),
		properties,
		start: node.getStart(sourceFile),
		...(isNodeWithText(node) && { text: node.text }),
	};
}

function isNodeWithText(node: Node): node is Node & { text: string } {
	return (
		isIdentifier(node) ||
		isPrivateIdentifier(node) ||
		isLiteralExpression(node) ||
		isTemplateLiteralToken(node)
	);
}
