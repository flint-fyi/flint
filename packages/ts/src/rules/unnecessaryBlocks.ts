import { type AST, typescriptLanguage } from "@flint.fyi/typescript-language";
import { isNodeFlagSet } from "ts-api-utils";
import ts, { SyntaxKind } from "typescript";

import { ruleCreator } from "./ruleCreator.ts";

function isUsingVariableStatement(node: AST.AnyNode) {
	return (
		node.kind == SyntaxKind.VariableStatement &&
		isNodeFlagSet(node.declarationList, ts.NodeFlags.Using)
	);
}

function isValidBlock(node: AST.Block) {
	switch (node.parent.kind) {
		case SyntaxKind.ArrowFunction:
		case SyntaxKind.CaseClause:
		case SyntaxKind.CatchClause:
		case SyntaxKind.Constructor:
		case SyntaxKind.DefaultClause:
		case SyntaxKind.DoStatement:
		case SyntaxKind.ForInStatement:
		case SyntaxKind.ForOfStatement:
		case SyntaxKind.ForStatement:
		case SyntaxKind.FunctionDeclaration:
		case SyntaxKind.FunctionExpression:
		case SyntaxKind.GetAccessor:
		case SyntaxKind.IfStatement:
		case SyntaxKind.LabeledStatement:
		case SyntaxKind.MethodDeclaration:
		case SyntaxKind.ModuleBlock:
		case SyntaxKind.SetAccessor:
		case SyntaxKind.TryStatement:
		case SyntaxKind.WhileStatement:
		case SyntaxKind.WithStatement:
			return true;

		default:
			return node.statements.some(isUsingVariableStatement);
	}
}

export default ruleCreator.createRule(typescriptLanguage, {
	about: {
		description:
			"Reports standalone block statements that don't create a meaningful scope.",
		id: "unnecessaryBlocks",
		presets: ["stylistic", "stylisticStrict"],
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
