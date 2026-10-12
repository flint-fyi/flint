import { isStringLiteralLike, SyntaxKind } from "typescript";

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
	targetNode: AST.Expression;
}

interface CalleeChain {
	name: string;
	segments: string[];
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
		targetNode: getTargetNode(node.expression),
	};

	switch (skipNonNullExpressions(node.expression).kind) {
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

	return undefined;
}

function getTargetNode(node: AST.Expression): AST.Expression {
	switch (node.kind) {
		case SyntaxKind.CallExpression:
		case SyntaxKind.NonNullExpression:
			return getTargetNode(node.expression);

		case SyntaxKind.TaggedTemplateExpression:
			return getTargetNode(node.tag);

		default:
			return node;
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
			if (!isStringLiteralLike(node.argumentExpression)) {
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
				}
			);
		}

		case SyntaxKind.Identifier:
			return {
				name: node.text,
				segments: [],
			};

		case SyntaxKind.NonNullExpression:
			return parseCalleeChain(node.expression);

		case SyntaxKind.PropertyAccessExpression: {
			const parsedExpression = parseCalleeChain(node.expression);

			return (
				parsedExpression && {
					...parsedExpression,
					segments: [...parsedExpression.segments, node.name.text],
				}
			);
		}

		case SyntaxKind.TaggedTemplateExpression:
			return parseCalleeChain(node.tag);
	}

	return undefined;
}

function skipNonNullExpressions(node: AST.Expression): AST.Expression {
	return node.kind === SyntaxKind.NonNullExpression
		? skipNonNullExpressions(node.expression)
		: node;
}
