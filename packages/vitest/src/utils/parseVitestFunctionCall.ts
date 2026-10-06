import { SyntaxKind } from "typescript";

import type { AST } from "@flint.fyi/typescript-language";

const vitestFunctionKinds = {
	afterAll: "hook",
	afterEach: "hook",
	aroundAll: "hook",
	aroundEach: "hook",
	beforeAll: "hook",
	beforeEach: "hook",
	describe: "describe",
	it: "test",
	suite: "describe",
	test: "test",
} as const;

export type VitestFunctionKind =
	(typeof vitestFunctionKinds)[VitestFunctionName];

export type VitestFunctionName = keyof typeof vitestFunctionKinds;

const knownVitestFunctionModifiersSet = new Set([
	"concurrent",
	"fails",
	"only",
	"runIf",
	"sequential",
	"shuffle",
	"skip",
	"skipIf",
	"todo",
]);

export interface VitestFunctionCall extends VitestCallee {
	kind: VitestFunctionKind;
	name: VitestFunctionName;
}

interface VitestCallee {
	name: string;
	segments: string[];
	targetNode: AST.AnyNode;
}

export function parseVitestFunctionCall(
	node: AST.CallExpression,
): undefined | VitestFunctionCall {
	const parsedCallee = parseVitestCallee(node.expression);
	if (!parsedCallee) {
		return;
	}

	const { name } = parsedCallee;
	if (!isVitestFunctionName(name)) {
		return;
	}

	const functionCall: VitestFunctionCall = {
		...parsedCallee,
		kind: vitestFunctionKinds[name],
		name,
	};

	switch (node.expression.kind) {
		case SyntaxKind.CallExpression:
		case SyntaxKind.TaggedTemplateExpression:
			return parsedCallee.segments
				.slice(0, -1)
				.every((segment) => knownVitestFunctionModifiersSet.has(segment))
				? functionCall
				: undefined;

		case SyntaxKind.Identifier:
			return functionCall;

		case SyntaxKind.PropertyAccessExpression:
			return parsedCallee.segments.every((segment) =>
				knownVitestFunctionModifiersSet.has(segment),
			)
				? functionCall
				: undefined;
	}
}

function isVitestFunctionName(name: string): name is VitestFunctionName {
	return Object.hasOwn(vitestFunctionKinds, name);
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
