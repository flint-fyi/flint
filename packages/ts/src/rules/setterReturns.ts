import { typescriptLanguage } from "@flint.fyi/typescript-language";
import * as tsutils from "ts-api-utils";
import ts from "typescript";

import { ruleCreator } from "./ruleCreator.ts";

export default ruleCreator.createRule(typescriptLanguage, {
	about: {
		description: "Reports return statements with values inside setters.",
		id: "setterReturns",
		presets: ["javascript"],
	},
	messages: {
		noSetterReturn: {
			primary: "Values returned by setters are always ignored.",
			secondary: [
				"Setters are expected to have side effects only and not produce a return value.",
				"Any returned value from a setter is ignored.",
			],
			suggestions: [
				"Remove the return value.",
				"Use a regular method instead.",
			],
		},
	},
	setup(context) {
		return {
			visitors: {
				SetAccessor: (node, { sourceFile }) => {
					if (!node.body) {
						return;
					}

					// TODO: This will be more clean when there is a scope manager
					// https://github.com/flint-fyi/flint/issues/400
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
