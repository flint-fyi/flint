import { NodeFlags, SyntaxKind } from "typescript-native/unstable/ast";

import {
	typescriptLanguage,
	type AST,
	type TypeScriptFileServices,
} from "@flint.fyi/typescript-language";

import { ruleCreator } from "./ruleCreator.ts";

export default ruleCreator.createRule(typescriptLanguage, {
	about: {
		description:
			"Reports lexical declarations in case clauses without wrapping them in blocks.",
		id: "caseDeclarations",
		presets: ["javascript"],
	},
	messages: {
		unexpectedLexicalDeclaration: {
			primary:
				"Variables declared in case clauses without braces leak into the surrounding scope.",
			secondary: [
				"Lexical declarations (let, const, function, class) are scoped to the entire switch statement, not just the case clause where they are declared.",
				"This can lead to unexpected behavior when the same variable name is used in multiple case clauses, as they will conflict in the same scope.",
			],
			suggestions: [
				"Wrap the case clause contents in curly braces {} to create a block scope.",
			],
		},
	},
	setup(context) {
		function getLexicalDeclarationRange(
			statements: readonly AST.Statement[],
			sourceFile: AST.SourceFile,
		): undefined | { begin: number; end: number } {
			for (const statement of statements) {
				if (
					statement.kind === SyntaxKind.VariableStatement &&
					(statement.declarationList.flags &
						(NodeFlags.Let | NodeFlags.Const)) !==
						0
				) {
					const begin = statement.getStart(sourceFile);
					return {
						begin,
						end:
							begin +
							(statement.declarationList.flags & NodeFlags.Const ? 5 : 3),
					};
				}

				if (
					statement.kind === SyntaxKind.ClassDeclaration ||
					statement.kind === SyntaxKind.FunctionDeclaration
				) {
					const begin = statement.getStart(sourceFile);
					return {
						begin,
						end:
							begin + (statement.kind === SyntaxKind.ClassDeclaration ? 5 : 8),
					};
				}
			}

			return undefined;
		}

		function checkClause(
			node: AST.CaseClause | AST.DefaultClause,
			{ sourceFile }: TypeScriptFileServices,
		): void {
			const declarationRange = getLexicalDeclarationRange(
				node.statements,
				sourceFile,
			);
			if (declarationRange) {
				context.report({
					message: "unexpectedLexicalDeclaration",
					range: declarationRange,
				});
			}
		}

		return {
			visitors: {
				CaseClause: checkClause,
				DefaultClause: checkClause,
			},
		};
	},
});
