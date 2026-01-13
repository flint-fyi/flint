import { nullThrows } from "@flint.fyi/utils";
import { SyntaxKind } from "typescript";

import { typescriptLanguage } from "../language.ts";
import { isGlobalDeclaration } from "../utils/isGlobalDeclaration.ts";

export default typescriptLanguage.createRule({
	about: {
		description: "Reports using async functions as Promise executor functions.",
		id: "asyncPromiseExecutors",
		preset: "logical",
	},
	messages: {
		asyncPromiseExecutor: {
			primary:
				"Async Promise executor functions are not able to properly catch thrown errors and often indicate unnecessarily complex logic.",
			secondary: [
				"The Promise executor function is called synchronously by the Promise constructor.",
				"If an async function is used as a Promise executor, thrown errors will not be caught by the Promise and will instead result in unhandled rejections.",
				"Additionally, if a Promise executor function is using `await`, there's probably no need to use the `new Promise` constructor.",
			],
			suggestions: [
				"Remove the `async` keyword from the executor function.",
				"If you need to use `await` inside the Promise, consider restructuring your code to avoid the Promise constructor.",
			],
		},
	},
	setup(context) {
		return {
			visitors: {
				NewExpression: (node, { sourceFile, typeChecker }) => {
					if (
						!isGlobalDeclaration(node.expression, typeChecker) ||
						!node.arguments?.length
					) {
						return;
					}

					const executor = nullThrows(
						node.arguments[0],
						"Expected there to be a promise executor!",
					);
					if (
						executor.kind !== SyntaxKind.FunctionExpression &&
						executor.kind !== SyntaxKind.ArrowFunction
					) {
						return;
					}

					const asyncModifier = executor.modifiers?.find(
						(mod) => mod.kind === SyntaxKind.AsyncKeyword,
					);
					if (!asyncModifier) {
						return;
					}

					context.report({
						message: "asyncPromiseExecutor",
						range: {
							begin: asyncModifier.getStart(sourceFile),
							end: asyncModifier.getEnd(),
						},
					});
				},
			},
		};
	},
});
