import type { AST } from "@flint.fyi/typescript-language";
import ts from "typescript";

const knownVitestFunctionNames = [
	"afterAll",
	"afterEach",
	"beforeAll",
	"beforeEach",
	"describe",
	"fit",
	"it",
	"test",
	"xdescribe",
	"xit",
	"xit",
	"xtest",
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
		case ts.SyntaxKind.CallExpression:
		case ts.SyntaxKind.TaggedTemplateExpression:
			return parsedCallee.segments
				.slice(0, -1)
				.every((segment) => knownVitestFunctionModifiersSet.has(segment))
				? parsedCallee
				: undefined;

		case ts.SyntaxKind.Identifier:
			return parsedCallee;

		case ts.SyntaxKind.PropertyAccessExpression:
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
		case ts.SyntaxKind.CallExpression:
			return parseVitestCallee(node.expression, targetNode);

		case ts.SyntaxKind.Identifier:
			return {
				name: node.text,
				segments: [],
				targetNode: targetNode ?? node,
			};

		case ts.SyntaxKind.PropertyAccessExpression: {
			const parsedExpression = parseVitestCallee(node.expression, node);

			return (
				parsedExpression && {
					...parsedExpression,
					segments: [...parsedExpression.segments, node.name.text],
					targetNode: node,
				}
			);
		}

		case ts.SyntaxKind.TaggedTemplateExpression:
			return parseVitestCallee(node.tag, targetNode);
	}
}
