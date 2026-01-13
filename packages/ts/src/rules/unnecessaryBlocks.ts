import { SyntaxKind } from "typescript";

import { typescriptLanguage } from "../language.ts";
import * as AST from "../types/ast.ts";

export default typescriptLanguage.createRule({
	about: {
		description:
			"Reports standalone block statements that don't create a meaningful scope.",
		id: "unnecessaryBlocks",
		preset: "stylistic",
	},
	messages: {
		unnecessaryBlock: {
			primary:
				"This standalone block statement is unnecessary and doesn't change any variable scopes.",
			secondary: [
				"Standalone block statements that aren't part of control flow (if/else, loops, switch) or don't create a meaningful lexical scope can be confusing and should be avoided.",
				"In modern JavaScript and TypeScript, blocks primarily serve to create lexical scope for `let` and `const` variables, but this is often better achieved through other means.",
			],
			suggestions: [
				"Remove the block statement and move its contents to the parent scope.",
				"If you need lexical scoping, consider using an IIFE (Immediately Invoked Function Expression) or extracting to a separate function.",
			],
		},
	},
	setup(context) {
		function isValidBlock(node: AST.Block): boolean {
			const parent = node.parent;

			// Valid blocks: function bodies, arrow functions, class/interface bodies, etc.
			if (
				parent.kind == SyntaxKind.FunctionDeclaration ||
				parent.kind == SyntaxKind.FunctionExpression ||
				parent.kind == SyntaxKind.ArrowFunction ||
				parent.kind == SyntaxKind.MethodDeclaration ||
				parent.kind == SyntaxKind.Constructor ||
				parent.kind == SyntaxKind.GetAccessor ||
				parent.kind == SyntaxKind.SetAccessor ||
				parent.kind == SyntaxKind.ModuleBlock
			) {
				return true;
			}

			// Valid blocks: control flow statements
			if (
				parent.kind == SyntaxKind.IfStatement ||
				parent.kind == SyntaxKind.ForStatement ||
				parent.kind == SyntaxKind.ForInStatement ||
				parent.kind == SyntaxKind.ForOfStatement ||
				parent.kind == SyntaxKind.WhileStatement ||
				parent.kind == SyntaxKind.DoStatement ||
				parent.kind == SyntaxKind.WithStatement ||
				parent.kind == SyntaxKind.TryStatement ||
				parent.kind == SyntaxKind.CatchClause
			) {
				return true;
			}

			// Valid block: switch case/default clause with block
			// In ES6+, blocks in switch cases create scope for let/const
			if (
				parent.kind == SyntaxKind.CaseClause ||
				parent.kind == SyntaxKind.DefaultClause
			) {
				return true;
			}

			// Valid block: labeled statement
			if (parent.kind == SyntaxKind.LabeledStatement) {
				return true;
			}

			return false;
		}

		return {
			visitors: {
				Block: (node, { sourceFile }) => {
					if (!isValidBlock(node)) {
						context.report({
							message: "unnecessaryBlock",
							range: {
								begin: node.getStart(sourceFile),
								end: node.getStart(sourceFile) + 1,
							},
						});
					}
				},
			},
		};
	},
});
