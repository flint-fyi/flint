import * as tsutils from "ts-api-utils";
import ts from "typescript";

import { typescriptLanguage } from "@flint.fyi/typescript-language";

import { ruleCreator } from "./ruleCreator.ts";

export default ruleCreator.createRule(typescriptLanguage, {
	about: {
		description: "Reports awaiting a value that is not a Thenable.",
		id: "awaitThenable",
		presets: ["logical", "logicalStrict"],
	},
	messages: {
		awaitNonThenable: {
			primary:
				"Awaiting a non-Promise (non-Thenable) value is unnecessary and indicates a likely mistake.",
			secondary: [
				"The `await` keyword is designed for values with a `then` method, such as Promises.",
				"If `await` is used on a non-Thenable value, the value is directly resolved, but execution still pauses until the next microtask.",
				"This often indicates a programmer error, such as forgetting to call a function that returns a Promise.",
			],
			suggestions: [
				"Remove the unnecessary `await` keyword.",
				"Ensure you are awaiting the correct value, such as a function call that returns a Promise.",
			],
		},
		forAwaitNonAsyncIterable: {
			primary:
				"Using `for await...of` on a value that is not async iterable is unnecessary.",
			secondary: [
				"The `for await...of` statement is designed for async iterable objects.",
				"Using it on a synchronous iterable works but introduces subtle error handling differences and obscures intent.",
			],
			suggestions: [
				"Use an ordinary `for...of` loop instead.",
				"If you need to await each value, use `for...of` with `await` inside the loop body.",
			],
		},
	},
	setup(context) {
		return {
			visitors: {
				AwaitExpression: (node, { sourceFile, typeChecker }) => {
					const type = typeChecker.getTypeAtLocation(node.expression);

					if (tsutils.isTypeFlagSet(type, ts.TypeFlags.Any)) {
						return;
					}

					if (tsutils.isThenableType(typeChecker, node.expression, type)) {
						return;
					}

					const awaitKeyword = node.getFirstToken(sourceFile);
					if (awaitKeyword?.kind !== ts.SyntaxKind.AwaitKeyword) {
						return;
					}

					context.report({
						message: "awaitNonThenable",
						range: {
							begin: awaitKeyword.getStart(sourceFile),
							end: awaitKeyword.getEnd(),
						},
					});
				},
				ForOfStatement: (node, { sourceFile, typeChecker }) => {
					if (!node.awaitModifier) {
						return;
					}

					const type = typeChecker.getTypeAtLocation(node.expression);

					if (tsutils.isTypeFlagSet(type, ts.TypeFlags.Any)) {
						return;
					}

					const hasAsyncIteratorSymbol = tsutils
						.unionConstituents(type)
						.some(
							(typePart) =>
								tsutils.getWellKnownSymbolPropertyOfType(
									typePart,
									"asyncIterator",
									typeChecker,
								) !== undefined,
						);

					if (hasAsyncIteratorSymbol) {
						return;
					}

					context.report({
						message: "forAwaitNonAsyncIterable",
						range: {
							begin: node.awaitModifier.getStart(sourceFile),
							end: node.awaitModifier.getEnd(),
						},
					});
				},
			},
		};
	},
});
