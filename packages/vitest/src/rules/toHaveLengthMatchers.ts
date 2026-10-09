import { isOptionalChain, isStringLiteralLike, SyntaxKind } from "typescript";

import {
	getTSNodeRange,
	typescriptLanguage,
	type AST,
} from "@flint.fyi/typescript-language";

import { ruleCreator } from "../ruleCreator.ts";

type AccessExpression =
	| AST.ElementAccessExpression
	| AST.PropertyAccessExpression;

const equalityMatchers = new Set(["toBe", "toEqual", "toStrictEqual"]);

export default ruleCreator.createRule(typescriptLanguage, {
	about: {
		description:
			"Reports equality matchers on `.length` that could use `toHaveLength()`.",
		id: "toHaveLengthMatchers",
		presets: ["stylistic", "stylisticStrict"],
	},
	messages: {
		preferToHaveLength: {
			primary: "Prefer `toHaveLength()` over an equality matcher on `.length`.",
			secondary: [
				"`toHaveLength()` states that the assertion is about the length of a value.",
				"When it fails, Vitest prints the received value along with its length.",
				"An equality matcher on `.length` only prints the two numbers.",
			],
			suggestions: [
				"Pass the value itself to `expect()` and assert with `toHaveLength()`.",
			],
		},
	},
	setup(context) {
		return {
			visitors: {
				CallExpression: (node, { sourceFile }) => {
					const matcher = node.expression;
					if (
						!isAccessExpression(matcher) ||
						!equalityMatchers.has(getAccessedName(matcher) ?? "")
					) {
						return;
					}

					const received = getExpectCall(matcher.expression)?.arguments[0];
					if (
						!received ||
						!isAccessExpression(received) ||
						getAccessedName(received) !== "length" ||
						isOptionalChain(received)
					) {
						return;
					}

					context.report({
						fix: [
							{
								range: {
									begin: received.expression.getEnd(),
									end: received.getEnd(),
								},
								text: "",
							},
							{
								range: {
									begin: matcher.expression.getEnd(),
									end: matcher.getEnd(),
								},
								text: ".toHaveLength",
							},
						],
						message: "preferToHaveLength",
						range: getTSNodeRange(
							matcher.kind === SyntaxKind.PropertyAccessExpression
								? matcher.name
								: matcher.argumentExpression,
							sourceFile,
						),
					});
				},
			},
		};
	},
});

function getAccessedName(node: AccessExpression): string | undefined {
	if (node.kind === SyntaxKind.PropertyAccessExpression) {
		return node.name.text;
	}

	return isStringLiteralLike(node.argumentExpression)
		? node.argumentExpression.text
		: undefined;
}

function getExpectCall(node: AST.Expression): AST.CallExpression | undefined {
	switch (node.kind) {
		case SyntaxKind.CallExpression:
			return node.expression.kind === SyntaxKind.Identifier &&
				node.expression.text === "expect"
				? node
				: undefined;

		case SyntaxKind.ElementAccessExpression:
		case SyntaxKind.PropertyAccessExpression:
			return getExpectCall(node.expression);

		default:
			return undefined;
	}
}

function isAccessExpression(node: AST.Expression): node is AccessExpression {
	return (
		node.kind === SyntaxKind.ElementAccessExpression ||
		node.kind === SyntaxKind.PropertyAccessExpression
	);
}
