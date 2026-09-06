import {
	createScanner,
	NodeFlags,
	SyntaxKind,
} from "typescript-native/unstable/ast";

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
				let declarationKind: SyntaxKind | undefined;
				if (
					statement.kind === SyntaxKind.VariableStatement &&
					(statement.declarationList.flags &
						(NodeFlags.Let | NodeFlags.Const)) !==
						0
				) {
					declarationKind =
						statement.declarationList.flags & NodeFlags.Const
							? SyntaxKind.ConstKeyword
							: SyntaxKind.LetKeyword;
				}

				if (
					statement.kind === SyntaxKind.ClassDeclaration ||
					statement.kind === SyntaxKind.FunctionDeclaration
				) {
					declarationKind =
						statement.kind === SyntaxKind.ClassDeclaration
							? SyntaxKind.ClassKeyword
							: SyntaxKind.FunctionKeyword;
				}

				if (declarationKind === undefined) {
					continue;
				}

				const statementStart = statement.getStart(sourceFile);
				const scanner = createScanner(
					true,
					sourceFile.languageVariant,
					sourceFile.text,
					statementStart,
					statement.getEnd() - statementStart,
				);
				let tokenKind: SyntaxKind;
				do {
					tokenKind = scanner.scan();
				} while (
					tokenKind !== declarationKind &&
					tokenKind !== SyntaxKind.EndOfFile
				);
				if (tokenKind !== declarationKind) {
					continue;
				}
				return {
					begin: scanner.getTokenStart(),
					end: scanner.getTokenEnd(),
				};
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
