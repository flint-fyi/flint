import * as tsutils from "ts-api-utils";
import ts from "typescript";

import { typescriptLanguage } from "../language.ts";

export default typescriptLanguage.createRule({
	about: {
		description: "Reports returning values from constructor functions.",
		id: "constructorReturns",
		preset: "untyped",
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

					function checkForReturnStatements(node: ts.Node): void {
						if (ts.isReturnStatement(node)) {
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

						if (tsutils.isFunctionScopeBoundary(node)) {
							return;
						}

						ts.forEachChild(node, checkForReturnStatements);
					}

					ts.forEachChild(node.body, checkForReturnStatements);
				},
			},
		};
	},
});
