import { type AST, typescriptLanguage } from "@flint.fyi/typescript-language";
import ts from "typescript";

import { ruleCreator } from "./ruleCreator.ts";

function containsThis(node: ts.Node): boolean {
	if (node.kind === ts.SyntaxKind.ThisKeyword) {
		return true;
	}

	if (
		ts.isFunctionExpression(node) ||
		ts.isFunctionDeclaration(node) ||
		ts.isArrowFunction(node)
	) {
		return false;
	}

	let found = false;
	node.forEachChild((child) => {
		if (containsThis(child)) {
			found = true;
		}
	});
	return found;
}

function unwrapParentheses(node: ts.Expression): ts.Expression {
	while (ts.isParenthesizedExpression(node)) {
		node = node.expression;
	}
	return node;
}

export default ruleCreator.createRule(typescriptLanguage, {
	about: {
		description: "Reports unnecessary .bind() calls.",
		id: "unnecessaryBind",
		presets: ["logical"],
	},
	messages: {
		unnecessaryBind: {
			primary: "The .bind() call is unnecessary.",
			secondary: ["This function does not use 'this'."],
			suggestions: ["Remove the .bind() call."],
		},
		arrowBind: {
			primary: "Do not use .bind() on arrow functions.",
			secondary: [
				"Arrow functions have lexical 'this' binding.",
				"Calling .bind() on an arrow function has no effect.",
			],
			suggestions: ["Remove the .bind() call."],
		},
	},
	setup(context) {
		return {
			visitors: {
				CallExpression(node: AST.CallExpression, { sourceFile }) {
					if (!ts.isPropertyAccessExpression(node.expression)) {
						return;
					}

					const propertyAccess = node.expression;
					if (propertyAccess.name.text !== "bind") {
						return;
					}

					if (node.arguments.length !== 1) {
						return;
					}

					const boundFunction = unwrapParentheses(propertyAccess.expression);

					if (ts.isArrowFunction(boundFunction)) {
						context.report({
							message: "arrowBind",
							range: {
								begin: node.getStart(sourceFile),
								end: node.getEnd(),
							},
						});
						return;
					}

					if (ts.isFunctionExpression(boundFunction)) {
						if (!containsThis(boundFunction.body)) {
							context.report({
								message: "unnecessaryBind",
								range: {
									begin: boundFunction.getStart(sourceFile),
									end: node.getEnd(),
								},
							});
						}
					}
				},
			},
		};
	},
});
