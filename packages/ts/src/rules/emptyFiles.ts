import { type AST, typescriptLanguage } from "@flint.fyi/typescript-language";
import { SyntaxKind } from "typescript";

import { ruleCreator } from "./ruleCreator.ts";

function isDirective(statement: AST.Statement) {
	return (
		statement.kind === SyntaxKind.ExpressionStatement &&
		statement.expression.kind === SyntaxKind.StringLiteral &&
		/^use \w+$/.exec(statement.expression.text)
	);
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
	return !isEmptyStatement(statement) && !isDirective(statement);
}

export default ruleCreator.createRule(typescriptLanguage, {
	about: {
		description: "Reports files that contain no meaningful code.",
		id: "emptyFiles",
		presets: ["stylistic", "stylisticStrict"],
	},
	messages: {
		emptyFile: {
			primary: "This file contains no meaningful code.",
			secondary: [
				"Empty files clutter the codebase and often serve no purpose.",
				"Files containing only whitespace, comments, directives, or empty statements are considered empty.",
			],
			suggestions: [
				"Add meaningful code to the file.",
				"Delete the file if it's no longer needed.",
			],
		},
	},
	setup(context) {
		return {
			visitors: {
				SourceFile: (sourceFile) => {
					if (
						!sourceFile.isDeclarationFile &&
						!sourceFile.statements.some(isMeaningfulStatement)
					) {
						context.report({
							message: "emptyFile",
							range: {
								begin: 0,
								end: 0,
							},
						});
					}
				},
			},
		};
	},
});
