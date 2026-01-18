import { type AST, typescriptLanguage } from "@flint.fyi/typescript-language";
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
			primary:
				"This getter implicitly returns `undefined` because it does not explicitly `return` a value.",
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
		return {
			visitors: {
				GetAccessor: (node, { sourceFile }) => {
					if (node.body && !statementsReturnValue(node.body.statements)) {
						context.report({
							message: "missingReturn",
							range: {
								begin: node.name.getStart(sourceFile),
								end: node.name.getEnd(),
							},
						});
					}
				},
			},
		};
	},
});

// TODO: This might get simpler when we have scope analysis.
// https://github.com/JoshuaKGoldberg/flint/issues/400
function ifStatementReturnsValue(statement: AST.IfStatement): boolean {
	return !!(
		statement.elseStatement &&
		statementReturnsValue(statement.thenStatement) &&
		statementReturnsValue(statement.elseStatement)
	);
}

function statementReturnsValue(statement: AST.Statement) {
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

function statementsReturnValue(statements: readonly AST.Statement[]) {
	return statements.some(statementReturnsValue);
}

function switchStatementReturnsValue(statement: AST.SwitchStatement) {
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

function tryStatementReturnsValue(statement: AST.TryStatement) {
	if (
		statement.finallyBlock &&
		statementsReturnValue(statement.finallyBlock.statements)
	) {
		return true;
	}

	const tryReturns = statementsReturnValue(statement.tryBlock.statements);

	if (!statement.catchClause) {
		return tryReturns;
	}

	const catchReturns = statementsReturnValue(
		statement.catchClause.block.statements,
	);

	return tryReturns && catchReturns;
}
