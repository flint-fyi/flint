import {
	type AST,
	getTSNodeRange,
	typescriptLanguage,
} from "@flint.fyi/typescript-language";
import { SyntaxKind } from "typescript";

import { ruleCreator } from "./ruleCreator.ts";

export default ruleCreator.createRule(typescriptLanguage, {
	about: {
		description:
			"Reports standalone new expressions that don't use the constructed object.",
		id: "newExpressions",
		presets: ["logical", "logicalStrict"],
	},
	messages: {
		noStandaloneNew: {
			primary:
				"Constructors should only be called when their return value is used.",
			secondary: [
				"Using `new` to construct an object but not storing or using the result is often a mistake or indicates unclear code intent.",
				"If the constructor has side effects you want to trigger, it's better to make that explicit by calling a separate method rather than relying on constructor side effects.",
			],
			suggestions: [
				"If you need to use the constructed object, assign it to a variable or return it.",
				"If you only need the constructor's side effects, consider refactoring to a function that makes the side effects explicit.",
			],
		},
	},
	setup(context) {
		function isStandaloneExpression(
			node: AST.BinaryExpression | AST.NewExpression,
		): boolean {
			switch (node.parent.kind) {
				// If parent is a comma expression, check recursively
				case SyntaxKind.BinaryExpression:
					if (node.parent.operatorToken.kind !== SyntaxKind.CommaToken) {
						return false;
					}

					// If this is the last expression in the comma sequence, check if the parent is standalone
					if (node.parent.right === node) {
						return isStandaloneExpression(node.parent);
					}

					return true;

				// If parent is an ExpressionStatement, it's standalone
				case SyntaxKind.ExpressionStatement:
					return true;

				default:
					return false;
			}
		}

		return {
			visitors: {
				NewExpression: (node, { sourceFile }) => {
					if (isStandaloneExpression(node)) {
						context.report({
							message: "noStandaloneNew",
							range: getTSNodeRange(node.getChildAt(0, sourceFile), sourceFile),
						});
					}
				},
			},
		};
	},
});
