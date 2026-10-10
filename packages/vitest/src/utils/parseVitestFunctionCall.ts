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

interface VitestKindMembers {
	/** Members that are invoked to produce another function, such as `each`. */
	factories: ReadonlySet<string>;
	/** Members that are accessed without being invoked, such as `skip`. */
	modifiers: ReadonlySet<string>;
}

const vitestKindMembers: Record<VitestFunctionKind, VitestKindMembers> = {
	describe: {
		factories: new Set(["each", "for", "runIf", "skipIf"]),
		modifiers: new Set([
			"concurrent",
			"only",
			"sequential",
			"shuffle",
			"skip",
			"todo",
		]),
	},
	hook: {
		factories: new Set(),
		modifiers: new Set(),
	},
	test: {
		factories: new Set([
			"each",
			"extend",
			"for",
			"override",
			"runIf",
			"scoped",
			"skipIf",
		]),
		modifiers: new Set([
			"concurrent",
			"fails",
			"only",
			"sequential",
			"skip",
			"todo",
		]),
	},
};

export interface VitestFunctionCall {
	kind: VitestFunctionKind;
	members: string[];
	name: VitestFunctionName;
	targetNode: AST.Expression;
}

interface CalleeChain {
	head: string;
	links: CalleeChainLink[];
}

interface CalleeChainLink {
	invoked: boolean;
	member: string;
}

export function parseVitestFunctionCall(
	node: AST.CallExpression,
): undefined | VitestFunctionCall {
	const chain = parseCalleeChain(node.expression, false);
	if (!chain) {
		return;
	}

	const name = chain.head;
	if (!isVitestFunctionName(name)) {
		return;
	}

	const kind = vitestFunctionKinds[name];
	const { factories, modifiers } = vitestKindMembers[kind];

	if (
		chain.links.some(
			({ invoked, member }) =>
				!(invoked ? factories.has(member) : modifiers.has(member)),
		)
	) {
		return;
	}

	return {
		kind,
		members: chain.links.map(({ member }) => member),
		name,
		targetNode: getTargetNode(node.expression),
	};
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

function parseCalleeChain(
	node: AST.AnyNode,
	invoked: boolean,
): CalleeChain | undefined {
	switch (node.kind) {
		case SyntaxKind.CallExpression:
			return invoked ? undefined : parseCalleeChain(node.expression, true);

		case SyntaxKind.ElementAccessExpression: {
			if (!isStringLiteralLike(node.argumentExpression)) {
				return;
			}

			const chain = parseCalleeChain(node.expression, false);
			chain?.links.push({ invoked, member: node.argumentExpression.text });
			return chain;
		}

		case SyntaxKind.Identifier:
			return invoked
				? undefined
				: {
						head: node.text,
						links: [],
					};

		case SyntaxKind.NonNullExpression:
			return parseCalleeChain(node.expression, invoked);

		case SyntaxKind.PropertyAccessExpression: {
			const chain = parseCalleeChain(node.expression, false);
			chain?.links.push({ invoked, member: node.name.text });
			return chain;
		}

		case SyntaxKind.TaggedTemplateExpression:
			return invoked ? undefined : parseCalleeChain(node.tag, true);
	}
}
