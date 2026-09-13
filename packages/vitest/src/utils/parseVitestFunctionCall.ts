import { SyntaxKind } from "typescript-native/unstable/ast";

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

export function parseVitestFunctionCall(
	node: AST.CallExpression,
): undefined | VitestCallee {
	const parsedCallee = parseVitestCallee(node.expression);

	if (!parsedCallee || !knownBlockNamesSet.has(parsedCallee.name)) {
		return undefined;
	}

	if (
		node.expression.kind === SyntaxKind.CallExpression ||
		node.expression.kind === SyntaxKind.TaggedTemplateExpression
	) {
		return parsedCallee.segments
			.slice(0, -1)
			.every((segment) => knownVitestFunctionModifiersSet.has(segment))
			? parsedCallee
			: undefined;
	}

	if (node.expression.kind === SyntaxKind.Identifier) {
		return parsedCallee;
	}

	return node.expression.kind === SyntaxKind.PropertyAccessExpression &&
		parsedCallee.segments.every((segment) =>
			knownVitestFunctionModifiersSet.has(segment),
		)
		? parsedCallee
		: undefined;
}

function parseVitestCallee(
	node: AST.AnyNode,
	targetNode?: AST.AnyNode,
): undefined | VitestCallee {
	if (node.kind === SyntaxKind.CallExpression) {
		return parseVitestCallee(node.expression, targetNode);
	}

	if (node.kind === SyntaxKind.Identifier) {
		return {
			name: node.text,
			segments: [],
			targetNode: targetNode ?? node,
		};
	}

	if (node.kind === SyntaxKind.PropertyAccessExpression) {
		const parsedExpression = parseVitestCallee(node.expression, node);

		return (
			parsedExpression && {
				...parsedExpression,
				segments: [...parsedExpression.segments, node.name.text],
				targetNode: node,
			}
		);
	}

	if (node.kind === SyntaxKind.TaggedTemplateExpression) {
		return parseVitestCallee(node.tag, targetNode);
	}

	return undefined;
}
