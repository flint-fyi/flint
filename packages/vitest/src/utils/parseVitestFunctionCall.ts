import { SyntaxKind } from "typescript";

import type { AST } from "@flint.fyi/typescript-language";

const knownVitestFunctionNames = [
	"afterAll",
	"afterEach",
	"beforeAll",
	"beforeEach",
	"describe",
	"it",
	"test",
] as const;

const knownBlockNamesSet = new Set<string>(knownVitestFunctionNames);

const knownVitestFunctionModifiersSet = new Set([
	"concurrent",
	"fails",
	"only",
	"runIf",
	"sequential",
	"skip",
	"skipIf",
	"todo",
]);

interface VitestCallee {
	name: string;
	segments: string[];
	targetNode: AST.AnyNode;
}

export function parseVitestFunctionCall(node: AST.CallExpression) {
	const parsedCallee = parseVitestCallee(node.expression);

	if (!parsedCallee || !knownBlockNamesSet.has(parsedCallee.name)) {
		return undefined;
	}

	switch (node.expression.kind) {
		case SyntaxKind.CallExpression:
		case SyntaxKind.TaggedTemplateExpression:
			return parsedCallee.segments
				.slice(0, -1)
				.every((segment) => knownVitestFunctionModifiersSet.has(segment))
				? parsedCallee
				: undefined;

		case SyntaxKind.Identifier:
			return parsedCallee;

		case SyntaxKind.PropertyAccessExpression:
			return parsedCallee.segments.every((segment) =>
				knownVitestFunctionModifiersSet.has(segment),
			)
				? parsedCallee
				: undefined;
	}
}

function parseVitestCallee(
	node: AST.AnyNode,
	targetNode?: AST.AnyNode,
): undefined | VitestCallee {
	switch (node.kind) {
		case SyntaxKind.CallExpression:
			return parseVitestCallee(node.expression, targetNode);

		case SyntaxKind.Identifier:
			return {
				name: node.text,
				segments: [],
				targetNode: targetNode ?? node,
			};

		case SyntaxKind.PropertyAccessExpression: {
			const parsedExpression = parseVitestCallee(node.expression, node);

			return (
				parsedExpression && {
					...parsedExpression,
					segments: [...parsedExpression.segments, node.name.text],
					targetNode: node,
				}
			);
		}

		case SyntaxKind.TaggedTemplateExpression:
			return parseVitestCallee(node.tag, targetNode);
	}
}
