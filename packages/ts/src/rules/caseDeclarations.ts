import * as tsutils from "ts-api-utils";
import ts, { SyntaxKind } from "typescript";

import { getTSNodeRange } from "../getTSNodeRange.ts";
import {
	type TypeScriptFileServices,
	typescriptLanguage,
} from "../language.ts";
import * as AST from "../types/ast.ts";

export default typescriptLanguage.createRule({
	about: {
		description:
			"Reports lexical declarations in case clauses without wrapping them in blocks.",
		id: "caseDeclarations",
		preset: "untyped",
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
		function getLexicalDeclaration(
			statements: ts.NodeArray<AST.Statement>,
			sourceFile: ts.SourceFile,
		): ts.Node | undefined {
			for (const statement of statements) {
				if (
					statement.kind === SyntaxKind.VariableStatement &&
					tsutils.isNodeFlagSet(
						statement.declarationList,
						ts.NodeFlags.Let | ts.NodeFlags.Const,
					)
				) {
					return statement.declarationList.getChildAt(0, sourceFile);
				}

				if (
					statement.kind === SyntaxKind.ClassDeclaration ||
					statement.kind === SyntaxKind.FunctionDeclaration
				) {
					return statement.getChildAt(0, sourceFile);
				}
			}

			return undefined;
		}

		function checkClause(
			node: AST.CaseClause | AST.DefaultClause,
			{ sourceFile }: TypeScriptFileServices,
		): void {
			const declarationNode = getLexicalDeclaration(
				node.statements,
				sourceFile,
			);
			if (declarationNode) {
				context.report({
					message: "unexpectedLexicalDeclaration",
					range: getTSNodeRange(declarationNode, sourceFile),
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
