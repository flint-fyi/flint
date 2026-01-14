import ts, { SyntaxKind } from "typescript";

import { getTSNodeRange } from "../getTSNodeRange.ts";
import { typescriptLanguage } from "../language.ts";
import * as AST from "../types/ast.ts";
import { ruleCreator } from "./ruleCreator.ts";

function alwaysReturns(node: AST.Statement) {
	switch (node.kind) {
		case SyntaxKind.Block:
			return node.statements.some(
				(statement) =>
					statement.kind === SyntaxKind.ReturnStatement ||
					hasNestedIfWithReturn(statement),
			);

		case SyntaxKind.ReturnStatement:
			return true;

		default:
			return hasNestedIfWithReturn(node);
	}
}

function findElseKeyword(node: AST.IfStatement, sourceFile: ts.SourceFile) {
	return node
		.getChildren(sourceFile)
		.find((child) => child.kind === SyntaxKind.ElseKeyword);
}

function hasNestedIfWithReturn(node: AST.Statement) {
	return (
		node.kind === SyntaxKind.IfStatement &&
		node.elseStatement !== undefined &&
		naiveHasReturn(node.thenStatement) &&
		naiveHasReturn(node.elseStatement)
	);
}

function isInStatementListContext(node: AST.IfStatement) {
	return (
		node.parent.kind === SyntaxKind.Block ||
		node.parent.kind === SyntaxKind.SourceFile ||
		node.parent.kind === SyntaxKind.ModuleBlock ||
		node.parent.kind === SyntaxKind.CaseClause ||
		node.parent.kind === SyntaxKind.DefaultClause
	);
}

function naiveHasReturn(node: AST.Statement) {
	if (node.kind === SyntaxKind.Block) {
		const block = node;
		const statements = block.statements;
		const lastStatement = statements.at(-1);

		return (
			lastStatement !== undefined &&
			lastStatement.kind === SyntaxKind.ReturnStatement
		);
	}

	return node.kind === SyntaxKind.ReturnStatement;
}

export default ruleCreator.createRule(typescriptLanguage, {
	about: {
		description:
			"Reports unnecessary `else` blocks following `if` statements that always return.",
		id: "elseReturns",
		presets: ["stylisticStrict"],
	},
	messages: {
		unnecessaryElse: {
			primary: "This `else` clause is unnecessary after a `return` statement.",
			secondary: [
				"When an `if` block always returns, the `else` block is redundant because the code after the `if` statement will only execute when the condition is false.",
			],
			suggestions: [
				"Remove the `else` keyword and un-indent the contents of the `else` block.",
			],
		},
	},
	setup(context) {
		return {
			visitors: {
				IfStatement: (node, { sourceFile }) => {
					if (!isInStatementListContext(node) || !node.elseStatement) {
						return;
					}

					const thenBranches: AST.Statement[] = [];
					let lastIfNode: AST.IfStatement = node;
					let currentNode: AST.Statement = node;

					while (currentNode.kind === SyntaxKind.IfStatement) {
						if (!currentNode.elseStatement) {
							return;
						}

						thenBranches.push(currentNode.thenStatement);
						lastIfNode = currentNode;
						currentNode = currentNode.elseStatement;
					}

					if (!thenBranches.every(alwaysReturns)) {
						return;
					}

					const elseKeyword = findElseKeyword(lastIfNode, sourceFile);
					if (!elseKeyword) {
						return;
					}

					context.report({
						message: "unnecessaryElse",
						range: getTSNodeRange(elseKeyword, sourceFile),
					});
				},
			},
		};
	},
});
