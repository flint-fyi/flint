import { typescriptLanguage } from "@flint.fyi/typescript-language";
import * as tsutils from "ts-api-utils";
import ts from "typescript";

import { ruleCreator } from "./ruleCreator.ts";

export default ruleCreator.createRule(typescriptLanguage, {
	about: {
		description: "Reports return statements with values inside setters.",
		id: "setterReturns",
		presets: ["untyped"],
	},
	messages: {
		noSetterReturn: {
			primary: "Setters cannot return a value.",
			secondary: [
				"Setters are expected to have side effects only and not produce a return value.",
				"Any returned value from a setter is ignored.",
			],
			suggestions: ["Remove the return value or use a regular method instead."],
		},
	},
	setup(context) {
		return {
			visitors: {
				SetAccessor: (node, { sourceFile }) => {
					if (!node.body) {
						return;
					}

					function checkForReturnStatements(node: ts.Node): void {
						if (ts.isReturnStatement(node)) {
							if (node.expression) {
								context.report({
									message: "noSetterReturn",
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
