import { type AST, typescriptLanguage } from "@flint.fyi/typescript-language";
import * as ts from "typescript";

import { ruleCreator } from "./ruleCreator.ts";

export default ruleCreator.createRule(typescriptLanguage, {
	about: {
		description: "Reports assigning `this` to a variable.",
		id: "thisAliases",
		presets: ["logical"],
	},
	messages: {
		noThisAlias: {
			primary:
				"Assigning `this` to a variable is unnecessary with arrow functions.",
			secondary: [
				"Arrow functions preserve the surrounding `this` context automatically.",
				"Aliasing `this` is a pre-ES6 pattern that is no longer needed.",
			],
			suggestions: [
				"Use arrow functions to preserve the `this` context.",
				"Access `this` directly instead of through an alias.",
			],
		},
	},
	setup(context) {
		return {
			visitors: {
				VariableDeclaration(node: AST.VariableDeclaration, { sourceFile }) {
					if (!node.initializer) {
						return;
					}

					if (node.initializer.kind !== ts.SyntaxKind.ThisKeyword) {
						return;
					}

					if (!ts.isIdentifier(node.name)) {
						return;
					}

					context.report({
						message: "noThisAlias",
						range: {
							begin: node.getStart(sourceFile),
							end: node.getEnd(),
						},
					});
				},
				BinaryExpression(node: AST.BinaryExpression, { sourceFile }) {
					if (node.operatorToken.kind !== ts.SyntaxKind.EqualsToken) {
						return;
					}

					if (node.right.kind !== ts.SyntaxKind.ThisKeyword) {
						return;
					}

					if (!ts.isIdentifier(node.left)) {
						return;
					}

					context.report({
						message: "noThisAlias",
						range: {
							begin: node.getStart(sourceFile),
							end: node.getEnd(),
						},
					});
				},
			},
		};
	},
});
