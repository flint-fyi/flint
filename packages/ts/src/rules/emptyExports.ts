import ts, { SyntaxKind } from "typescript";

import { typescriptLanguage } from "../language.ts";
import * as AST from "../types/ast.ts";
import { ruleCreator } from "./ruleCreator.ts";

const moduleIndicatorKinds = new Set([
	SyntaxKind.ExportAssignment,
	SyntaxKind.ExportDeclaration,
	SyntaxKind.ImportDeclaration,
	SyntaxKind.ImportEqualsDeclaration,
]);

function hasExportModifier(node: AST.Statement) {
	if (!ts.canHaveModifiers(node)) {
		return false;
	}

	return ts
		.getModifiers(node)
		?.some((modifier) => modifier.kind === SyntaxKind.ExportKeyword);
}

function hasOtherModuleIndicator(statements: readonly AST.Statement[]) {
	for (const statement of statements) {
		if (hasExportModifier(statement)) {
			return true;
		}

		if (!moduleIndicatorKinds.has(statement.kind)) {
			continue;
		}

		if (isEmptyNamedExport(statement)) {
			continue;
		}

		return true;
	}

	return false;
}

function isEmptyNamedExport(
	node: AST.Statement,
): node is AST.ExportDeclaration {
	if (node.kind !== SyntaxKind.ExportDeclaration) {
		return false;
	}

	if (node.moduleSpecifier) {
		return false;
	}

	if (!node.exportClause) {
		return false;
	}

	if (node.exportClause.kind !== SyntaxKind.NamedExports) {
		return false;
	}

	return node.exportClause.elements.length === 0;
}

export default ruleCreator.createRule(typescriptLanguage, {
	about: {
		description:
			"Reports empty export statements that don't make a file a module.",
		id: "emptyExports",
		presets: ["logical"],
	},
	messages: {
		uselessExport: {
			primary: "Empty export does nothing and can be removed.",
			secondary: [
				"An empty `export {}` statement is only useful when a file has no other imports or exports.",
				"When a file already has imports or exports, the empty export is redundant.",
			],
			suggestions: ["Remove the empty export statement."],
		},
	},
	setup(context) {
		function checkStatements(
			statements: readonly AST.Statement[],
			sourceFile: ts.SourceFile,
		) {
			if (!hasOtherModuleIndicator(statements)) {
				return;
			}

			for (const statement of statements) {
				if (!isEmptyNamedExport(statement)) {
					continue;
				}

				context.report({
					fix: {
						range: {
							begin: statement.pos,
							end: statement.end,
						},
						text: "",
					},
					message: "uselessExport",
					range: {
						begin: statement.getStart(sourceFile),
						end: statement.end,
					},
				});
			}
		}

		return {
			visitors: {
				ModuleBlock: (node, { sourceFile }) => {
					checkStatements(node.statements, sourceFile);
				},
				SourceFile: (node, { sourceFile }) => {
					if (sourceFile.fileName.endsWith(".d.ts")) {
						return;
					}

					checkStatements(node.statements, sourceFile);
				},
			},
		};
	},
});
