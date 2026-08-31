import { SyntaxKind } from "typescript-native/unstable/ast";

import {
	forEachChild,
	typescriptLanguage,
	type AST,
} from "@flint.fyi/typescript-language";

import { ruleCreator } from "./ruleCreator.ts";
import { isFunctionScopeBoundary } from "./utils/syntaxKinds.ts";

export default ruleCreator.createRule(typescriptLanguage, {
	about: {
		description: "Reports returning values from constructor functions.",
		id: "constructorReturns",
		presets: ["javascript"],
	},
	messages: {
		noConstructorReturn: {
			primary:
				"Returning a value from a constructor function overrides the newly created instance.",
			secondary: [
				"This behavior is often unintentional and can lead to unexpected results.",
				"If you need to return a different object, consider using a factory function instead.",
			],
			suggestions: [
				"Remove the return statement, or return without a value to exit early.",
			],
		},
	},
	setup(context) {
		return {
			visitors: {
				Constructor: (node, { sourceFile }) => {
					if (!node.body) {
						return;
					}

					function checkForReturnStatements(node: AST.AnyNode): void {
						if (node.kind === SyntaxKind.ReturnStatement) {
							if (node.expression) {
								context.report({
									message: "noConstructorReturn",
									range: {
										begin: node.getStart(sourceFile),
										end: node.getEnd(),
									},
								});
							}
							return;
						}

						if (isFunctionScopeBoundary(node)) {
							return;
						}

						forEachChild(node, checkForReturnStatements);
					}

					forEachChild(node.body, checkForReturnStatements);
				},
			},
		};
	},
});
