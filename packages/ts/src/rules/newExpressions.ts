import { SyntaxKind } from "typescript";

import { getTSNodeRange } from "../getTSNodeRange.ts";
import { typescriptLanguage } from "../language.ts";
import type * as AST from "../types/ast.ts";

export default typescriptLanguage.createRule({
	about: {
		description:
			"Reports standalone new expressions that don't use the constructed object.",
		id: "newExpressions",
		preset: "logical",
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
			const parent = node.parent;

			// If parent is an ExpressionStatement, it's standalone
			if (parent.kind === SyntaxKind.ExpressionStatement) {
				return true;
			}

			// If parent is a comma expression, check recursively
			if (
				parent.kind === SyntaxKind.BinaryExpression &&
				parent.operatorToken.kind === SyntaxKind.CommaToken
			) {
				// If this is the last expression in the comma sequence, check if the parent is standalone
				if (parent.right === node) {
					return isStandaloneExpression(parent);
				}
				return true;
			}

			return false;
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
