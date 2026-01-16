import {
	type AST,
	type TypeScriptFileServices,
	typescriptLanguage,
} from "@flint.fyi/typescript-language";
import { SyntaxKind } from "typescript";

import { ruleCreator } from "./ruleCreator.ts";

export default ruleCreator.createRule(typescriptLanguage, {
	about: {
		description: "Reports getter functions that do not return values.",
		id: "getterReturns",
		presets: ["untyped"],
	},
	messages: {
		missingReturn: {
			primary: "Getter functions must return a value.",
			secondary: [
				"A `get` accessor is expected to return a value when the property is accessed.",
				"A getter without a return statement will implicitly return `undefined`, which is likely unintentional.",
			],
			suggestions: [
				"Add a return statement with the desired value.",
				"If the property should not have a value, consider using a regular method instead.",
			],
		},
	},
	setup(context) {
		function checkGetter(
			node: AST.GetAccessorDeclaration,
			{ sourceFile }: TypeScriptFileServices,
		) {
			if (!node.body || allPathsReturnValue(node.body)) {
				return;
			}

			context.report({
				message: "missingReturn",
				range: {
					begin: node.name.getStart(sourceFile),
					end: node.name.getEnd(),
				},
			});
		}

		return {
			visitors: {
				GetAccessor: checkGetter,
			},
		};
	},
});

function allPathsReturnValue(block: AST.Block): boolean {
	return statementsReturnValue(block.statements);
}

function ifStatementReturnsValue(statement: AST.IfStatement): boolean {
	if (!statement.elseStatement) {
		return false;
	}

	return (
		statementReturnsValue(statement.thenStatement) &&
		statementReturnsValue(statement.elseStatement)
	);
}

function statementReturnsValue(statement: AST.Statement): boolean {
	switch (statement.kind) {
		case SyntaxKind.Block:
			return statementsReturnValue(statement.statements);

		case SyntaxKind.IfStatement:
			return ifStatementReturnsValue(statement);

		case SyntaxKind.ReturnStatement:
			return statement.expression !== undefined;

		case SyntaxKind.SwitchStatement:
			return switchStatementReturnsValue(statement);

		case SyntaxKind.ThrowStatement:
			return true;

		case SyntaxKind.TryStatement:
			return tryStatementReturnsValue(statement);

		default:
			return false;
	}
}

function statementsReturnValue(statements: readonly AST.Statement[]): boolean {
	for (const statement of statements) {
		if (statementReturnsValue(statement)) {
			return true;
		}
	}
	return false;
}

function switchStatementReturnsValue(statement: AST.SwitchStatement): boolean {
	const clauses = statement.caseBlock.clauses;
	if (clauses.length === 0) {
		return false;
	}

	let hasDefault = false;
	for (const clause of clauses) {
		if (clause.kind === SyntaxKind.DefaultClause) {
			hasDefault = true;
		}
		if (!statementsReturnValue(clause.statements)) {
			return false;
		}
	}

	return hasDefault;
}

function tryStatementReturnsValue(statement: AST.TryStatement): boolean {
	const tryReturns = statementsReturnValue(statement.tryBlock.statements);

	if (statement.finallyBlock) {
		if (statementsReturnValue(statement.finallyBlock.statements)) {
			return true;
		}
	}

	if (!statement.catchClause) {
		return tryReturns;
	}

	const catchReturns = statementsReturnValue(
		statement.catchClause.block.statements,
	);

	return tryReturns && catchReturns;
}
