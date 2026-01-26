import { type AST, typescriptLanguage } from "@flint.fyi/typescript-language";
import * as ts from "typescript";

import { ruleCreator } from "./ruleCreator.ts";

function isInsideFunction(node: ts.Node): boolean {
	let current = node.parent;
	while (current) {
		if (
			ts.isFunctionDeclaration(current) ||
			ts.isFunctionExpression(current) ||
			ts.isArrowFunction(current) ||
			ts.isMethodDeclaration(current) ||
			ts.isConstructorDeclaration(current) ||
			ts.isGetAccessorDeclaration(current) ||
			ts.isSetAccessorDeclaration(current)
		) {
			return true;
		}
		current = current.parent;
	}
	return false;
}

export default ruleCreator.createRule(typescriptLanguage, {
	about: {
		description: "Reports top-level await expressions in modules.",
		id: "topLevelAwaits",
		presets: ["logicalStrict"],
	},
	messages: {
		topLevelAwait: {
			primary: "Top-level await can block module loading.",
			secondary: [
				"Modules using top-level await block their dependents until the await resolves.",
				"This can cause unexpected delays in application startup.",
			],
			suggestions: [
				"Wrap the await in an async function that is called at the appropriate time.",
				"Use dynamic imports with `.then()` for lazy loading.",
			],
		},
	},
	setup(context) {
		return {
			visitors: {
				AwaitExpression(node: AST.AwaitExpression, { sourceFile }) {
					if (isInsideFunction(node)) {
						return;
					}

					context.report({
						message: "topLevelAwait",
						range: {
							begin: node.getStart(sourceFile),
							end: node.expression.getStart(sourceFile),
						},
					});
				},
			},
		};
	},
});
