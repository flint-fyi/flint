import { isNodeFlagSet } from "ts-api-utils";
import ts, { SyntaxKind } from "typescript";

import type { Fix } from "@flint.fyi/core";
import { typescriptLanguage, type AST } from "@flint.fyi/typescript-language";

import { ruleCreator } from "./ruleCreator.ts";

function canUnwrapStatements(node: AST.TryStatement): boolean {
	switch (node.parent.kind) {
		case SyntaxKind.Block:
		case SyntaxKind.CaseClause:
		case SyntaxKind.DefaultClause:
		case SyntaxKind.ModuleBlock:
		case SyntaxKind.SourceFile:
			return !node.tryBlock.statements.some(isScopedDeclaration);

		default:
			return false;
	}
}

function createFix(node: AST.CatchClause, sourceFile: AST.SourceFile): Fix {
	const tryStatement = node.parent;

	if (tryStatement.finallyBlock) {
		return {
			range: {
				begin: tryStatement.tryBlock.getEnd(),
				end: node.getEnd(),
			},
			text: "",
		};
	}

	const range = {
		begin: tryStatement.getStart(sourceFile),
		end: tryStatement.getEnd(),
	};

	if (!canUnwrapStatements(tryStatement)) {
		return { range, text: tryStatement.tryBlock.getText(sourceFile) };
	}

	return {
		range,
		text: sourceFile.text
			.slice(
				tryStatement.tryBlock.getStart(sourceFile) + 1,
				tryStatement.tryBlock.getEnd() - 1,
			)
			.trim(),
	};
}

function isScopedDeclaration(node: AST.Statement): boolean {
	switch (node.kind) {
		case SyntaxKind.ClassDeclaration:
		case SyntaxKind.EnumDeclaration:
		case SyntaxKind.FunctionDeclaration:
		case SyntaxKind.InterfaceDeclaration:
		case SyntaxKind.ModuleDeclaration:
		case SyntaxKind.TypeAliasDeclaration:
			return true;

		case SyntaxKind.VariableStatement:
			return isNodeFlagSet(node.declarationList, ts.NodeFlags.BlockScoped);

		default:
			return false;
	}
}

export default ruleCreator.createRule(typescriptLanguage, {
	about: {
		description:
			"Reports catch clauses that only rethrow the caught error without modification.",
		id: "unnecessaryCatches",
		presets: ["logical", "logicalStrict"],
	},
	messages: {
		unnecessaryCatch: {
			primary:
				"This catch clause is unnecessary, as it only rethrows the exception without modification.",
			secondary: [
				"A catch clause that only rethrows the caught error adds no value and creates unnecessary code complexity.",
				"Removing such catch clauses allows errors to propagate naturally without the overhead of an unnecessary try-catch block.",
			],
			suggestions: [
				"Remove the try-catch block if the catch clause only rethrows the error, or add meaningful error handling logic to the catch clause.",
			],
		},
	},
	setup(context) {
		return {
			visitors: {
				CatchClause: (node, { sourceFile }) => {
					if (!node.variableDeclaration) {
						return;
					}

					const statements = node.block.statements;

					if (statements.length !== 1) {
						return;
					}

					// Confirmed by the length check above
					/* eslint-disable-next-line @typescript-eslint/no-non-null-assertion */
					const statement = statements[0]!;

					if (statement.kind !== SyntaxKind.ThrowStatement) {
						return;
					}

					const catchVariable = node.variableDeclaration.name;
					const thrownExpression = statement.expression;

					if (
						catchVariable.kind !== SyntaxKind.Identifier ||
						thrownExpression.kind !== SyntaxKind.Identifier
					) {
						return;
					}

					if (catchVariable.text !== thrownExpression.text) {
						return;
					}

					const range = {
						begin: node.getStart(sourceFile),
						end: node.getStart(sourceFile) + "catch".length,
					};

					context.report({
						fix: createFix(node, sourceFile),
						message: "unnecessaryCatch",
						range,
					});
				},
			},
		};
	},
});
