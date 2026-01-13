import * as ts from "typescript";

import type { AST } from "../index.ts";
import { typescriptLanguage } from "../language.ts";

export default typescriptLanguage.createRule({
	about: {
		description:
			"Reports unnecessary `Promise.resolve()` or `Promise.reject()` in async contexts.",
		id: "asyncUnnecessaryPromiseWrappers",
		preset: "logical",
	},
	messages: {
		unnecessaryReject: {
			primary:
				"Errors can be thrown directly instead of wrapping in `Promise.reject()`.",
			secondary: [
				"In async functions, thrown errors are automatically converted to rejected promises.",
				"Using `Promise.reject()` is unnecessary and less idiomatic.",
			],
			suggestions: [
				"Throw the error directly instead of using `Promise.reject()`.",
			],
		},
		unnecessaryResolve: {
			primary:
				"Return values in async functions are already wrapped in a `Promise`.",
			secondary: [
				"Wrapping a value in `Promise.resolve()` is unnecessary in async functions.",
				"This adds extra code without changing the behavior.",
			],
			suggestions: ["Return the value directly instead of wrapping it."],
		},
	},
	setup(context) {
		return {
			visitors: {
				ArrowFunction: (node, { sourceFile }) => {
					if (!isAsyncFunction(node) || !ts.isCallExpression(node.body)) {
						return;
					}

					const message = getMessageForBody(node.body);
					if (!message) {
						return;
					}

					context.report({
						message,
						range: {
							begin: node.body.getStart(sourceFile),
							end: node.body.getEnd(),
						},
					});
				},
			},
		};
	},
});

function getMessageForBody(node: AST.CallExpression) {
	if (
		!ts.isPropertyAccessExpression(node.expression) ||
		!ts.isIdentifier(node.expression.expression) ||
		node.expression.expression.text !== "Promise"
	) {
		return undefined;
	}

	switch (node.expression.name.text) {
		case "reject":
			return "unnecessaryReject";
		case "resolve":
			return "unnecessaryResolve";
		default:
			return undefined;
	}
}

function isAsyncFunction(node: AST.ArrowFunction) {
	return node.modifiers?.some(
		(modifier) => modifier.kind === ts.SyntaxKind.AsyncKeyword,
	);
}
