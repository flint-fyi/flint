import {
	type AST,
	getTSNodeRange,
	typescriptLanguage,
} from "@flint.fyi/typescript-language";
import ts, { SyntaxKind } from "typescript";

import { ruleCreator } from "./ruleCreator.ts";

function alwaysTerminates(node: AST.Statement): boolean {
	switch (node.kind) {
		case SyntaxKind.Block:
			return node.statements.some(
				(statement) =>
					isTerminatingStatement(statement.kind) ||
					hasNestedIfThatTerminates(statement),
			);

		case SyntaxKind.ReturnStatement:
		case SyntaxKind.ThrowStatement:
			return true;

		default:
			return hasNestedIfThatTerminates(node);
	}
}

function findElseKeyword(node: AST.IfStatement, sourceFile: ts.SourceFile) {
	return node
		.getChildren(sourceFile)
		.find((child) => child.kind === SyntaxKind.ElseKeyword);
}

function hasNestedIfThatTerminates(node: AST.Statement): boolean {
	return (
		node.kind === SyntaxKind.IfStatement &&
		node.elseStatement !== undefined &&
		naiveTerminates(node.thenStatement) &&
		naiveTerminates(node.elseStatement)
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

function isTerminatingStatement(kind: SyntaxKind) {
	return (
		kind === SyntaxKind.ReturnStatement || kind === SyntaxKind.ThrowStatement
	);
}

function naiveTerminates(node: AST.Statement): boolean {
	if (node.kind !== SyntaxKind.Block) {
		return isTerminatingStatement(node.kind);
	}

	const lastStatement = node.statements.at(-1);

	if (!lastStatement) {
		return false;
	}

	return (
		isTerminatingStatement(lastStatement.kind) ||
		hasNestedIfThatTerminates(lastStatement)
	);
}

export default ruleCreator.createRule(typescriptLanguage, {
	about: {
		description:
			"Reports unnecessary `else` blocks following `if` statements that always return or throw.",
		id: "elseReturns",
		presets: ["stylisticStrict"],
	},
	messages: {
		unnecessaryElse: {
			primary:
				"This `else` clause is unnecessary after a terminating statement.",
			secondary: [
				"When an `if` block always returns or throws, the `else` block is redundant because the code after the `if` statement will only execute when the condition is false.",
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

					if (!thenBranches.every(alwaysTerminates)) {
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
