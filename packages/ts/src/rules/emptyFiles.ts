import { SyntaxKind } from "typescript";

import { typescriptLanguage } from "../language.ts";
import * as AST from "../types/ast.ts";
import { ruleCreator } from "./ruleCreator.ts";

function isDirective(statement: AST.Statement) {
	if (statement.kind !== SyntaxKind.ExpressionStatement) {
		return false;
	}

	const expressionStatement = statement;
	const expression = expressionStatement.expression;

	if (expression.kind !== SyntaxKind.StringLiteral) {
		return false;
	}

	const text = expression.text;

	return text === "use strict" || text === "use asm";
}

function isEmptyStatement(statement: AST.Statement) {
	switch (statement.kind) {
		case SyntaxKind.Block:
			return statement.statements.length === 0;
		case SyntaxKind.EmptyStatement:
			return true;
		default:
			return false;
	}
}

function isMeaningfulStatement(statement: AST.Statement) {
	if (isEmptyStatement(statement)) {
		return false;
	}

	if (isDirective(statement)) {
		return false;
	}

	return true;
}

export default ruleCreator.createRule(typescriptLanguage, {
	about: {
		description: "Reports files that contain no meaningful code.",
		id: "emptyFiles",
		presets: ["stylistic"],
		strictness: "strict",
	},
	messages: {
		emptyFile: {
			primary: "This file contains no meaningful code.",
			secondary: [
				"Empty files clutter the codebase and serve no purpose.",
				"Files containing only whitespace, comments, directives, or empty statements are considered empty.",
			],
			suggestions: [
				"Add meaningful code to the file, or delete it if it's no longer needed.",
			],
		},
	},
	setup(context) {
		return {
			visitors: {
				SourceFile: (sourceFile) => {
					if (sourceFile.isDeclarationFile) {
						return;
					}

					const hasMeaningfulCode = sourceFile.statements.some(
						isMeaningfulStatement,
					);

					if (hasMeaningfulCode) {
						return;
					}

					context.report({
						message: "emptyFile",
						range: {
							begin: 0,
							end: 0,
						},
					});
				},
			},
		};
	},
});
