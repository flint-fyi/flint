import ts, { SyntaxKind } from "typescript";

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

export interface VitestFunctionCall extends CalleeChain {
	kind: VitestFunctionKind;
	name: VitestFunctionName;
}

interface CalleeChain {
	name: string;
	segments: string[];
	targetNode: AST.AnyNode;
}

export function parseVitestFunctionCall(
	node: AST.CallExpression,
): undefined | VitestFunctionCall {
	const parsedCallee = parseCalleeChain(node.expression);
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

		case SyntaxKind.ElementAccessExpression:
		case SyntaxKind.PropertyAccessExpression:
			return parsedCallee.segments.every((segment) =>
				knownVitestFunctionModifiersSet.has(segment),
			)
				? functionCall
				: undefined;

		case SyntaxKind.Identifier:
			return functionCall;
	}
}

function isVitestFunctionName(name: string): name is VitestFunctionName {
	return Object.hasOwn(vitestFunctionKinds, name);
}

function parseCalleeChain(node: AST.AnyNode): CalleeChain | undefined {
	switch (node.kind) {
		case SyntaxKind.CallExpression:
			return parseCalleeChain(node.expression);

		case SyntaxKind.ElementAccessExpression: {
			if (!ts.isStringLiteralLike(node.argumentExpression)) {
				return;
			}

			const parsedExpression = parseCalleeChain(node.expression);

			return (
				parsedExpression && {
					...parsedExpression,
					segments: [
						...parsedExpression.segments,
						node.argumentExpression.text,
					],
					targetNode: node,
				}
			);
		}

		case SyntaxKind.Identifier:
			return {
				name: node.text,
				segments: [],
				targetNode: node,
			};

		case SyntaxKind.PropertyAccessExpression: {
			const parsedExpression = parseCalleeChain(node.expression);

			return (
				parsedExpression && {
					...parsedExpression,
					segments: [...parsedExpression.segments, node.name.text],
					targetNode: node,
				}
			);
		}

		case SyntaxKind.TaggedTemplateExpression:
			return parseCalleeChain(node.tag);
	}
}
