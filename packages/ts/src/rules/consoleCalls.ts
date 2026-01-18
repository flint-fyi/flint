import {
	getTSNodeRange,
	isGlobalVariable,
	typescriptLanguage,
} from "@flint.fyi/typescript-language";
import ts from "typescript";

import { ruleCreator } from "./ruleCreator.ts";

export default ruleCreator.createRule(typescriptLanguage, {
	about: {
		description: "Reports calls to console methods.",
		id: "consoleCalls",
	},
	messages: {
		noConsole: {
			primary: "Console method calls should not be used in production code.",
			secondary: [
				"Console methods like `console.log`, `console.warn`, and `console.error` are useful during development but should typically be removed before shipping to production.",
				"Consider using a proper logging library that can be configured for different environments.",
			],
			suggestions: [
				"Remove the console call before shipping this code to users.",
			],
		},
	},
	setup(context) {
		return {
			visitors: {
				CallExpression: (node, { sourceFile, typeChecker }) => {
					if (
						!ts.isPropertyAccessExpression(node.expression) ||
						!ts.isIdentifier(node.expression.expression) ||
						node.expression.expression.text !== "console" ||
						!isGlobalVariable(node.expression.expression, typeChecker)
					) {
						return;
					}

					context.report({
						message: "noConsole",
						range: getTSNodeRange(node, sourceFile),
					});
				},
			},
		};
	},
});
