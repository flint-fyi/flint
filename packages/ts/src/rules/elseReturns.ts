import ts, { SyntaxKind } from "typescript";
import { z } from "zod";

import { typescriptLanguage } from "../language.ts";
import * as AST from "../types/ast.ts";
import { ruleCreator } from "./ruleCreator.ts";

function alwaysReturns(node: AST.Statement): boolean {
	if (node.kind === SyntaxKind.Block) {
		const block = node;

		return block.statements.some(
			(statement) =>
				statement.kind === SyntaxKind.ReturnStatement ||
				hasNestedIfWithReturn(statement),
		);
	}

	return (
		node.kind === SyntaxKind.ReturnStatement || hasNestedIfWithReturn(node)
	);
}

function findElseKeyword(ifNode: AST.IfStatement, sourceFile: ts.SourceFile) {
	const children = ifNode.getChildren(sourceFile);

	for (const child of children) {
		if (child.kind === SyntaxKind.ElseKeyword) {
			return child;
		}
	}

	return undefined;
}

function hasNestedIfWithReturn(node: AST.Statement): boolean {
	if (node.kind !== SyntaxKind.IfStatement) {
		return false;
	}

	const ifNode = node;

	return (
		ifNode.elseStatement !== undefined &&
		naiveHasReturn(ifNode.thenStatement) &&
		naiveHasReturn(ifNode.elseStatement)
	);
}

function isIfStatement(node: AST.Statement): node is AST.IfStatement {
	return node.kind === SyntaxKind.IfStatement;
}

function isInStatementListContext(node: AST.IfStatement): boolean {
	const parent = node.parent;

	return (
		parent.kind === SyntaxKind.Block ||
		parent.kind === SyntaxKind.SourceFile ||
		parent.kind === SyntaxKind.ModuleBlock ||
		parent.kind === SyntaxKind.CaseClause ||
		parent.kind === SyntaxKind.DefaultClause
	);
}

function naiveHasReturn(node: AST.Statement): boolean {
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
	options: {
		allowElseIf: z
			.boolean()
			.default(true)
			.describe(
				"Whether to allow `else if` blocks after a `return` statement.",
			),
	},
	setup(context) {
		return {
			visitors: {
				IfStatement: (node, { options, sourceFile }) => {
					if (!isInStatementListContext(node)) {
						return;
					}

					if (!node.elseStatement) {
						return;
					}

					if (options.allowElseIf) {
						const thenBranches: AST.Statement[] = [];
						let lastIfNode: AST.IfStatement = node;
						let currentNode: AST.Statement = node;

						while (isIfStatement(currentNode)) {
							if (!currentNode.elseStatement) {
								return;
							}

							thenBranches.push(currentNode.thenStatement);
							lastIfNode = currentNode;
							currentNode = currentNode.elseStatement;
						}

						const alternate = lastIfNode.elseStatement;

						if (!alternate || alternate.kind === SyntaxKind.IfStatement) {
							return;
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
							range: {
								begin: elseKeyword.getStart(sourceFile),
								end: elseKeyword.getEnd(),
							},
						});
					} else {
						if (!alwaysReturns(node.thenStatement)) {
							return;
						}

						const elseKeyword = findElseKeyword(node, sourceFile);

						if (!elseKeyword) {
							return;
						}

						context.report({
							message: "unnecessaryElse",
							range: {
								begin: elseKeyword.getStart(sourceFile),
								end: elseKeyword.getEnd(),
							},
						});
					}
				},
			},
		};
	},
});
