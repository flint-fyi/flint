import { SyntaxKind } from "typescript";

import { typescriptLanguage } from "../language.ts";
import * as AST from "../types/ast.ts";
import { ruleCreator } from "./ruleCreator.ts";

function hasExportModifier(node: AST.Statement) {
	const modifiers = (node as { modifiers?: AST.ModifierLike[] }).modifiers;

	if (!modifiers) {
		return false;
	}

	return modifiers.some(
		(modifier) => (modifier as AST.Modifier).kind === SyntaxKind.ExportKeyword,
	);
}

function hasOtherExportOrImport(node: AST.Statement) {
	switch (node.kind) {
		case SyntaxKind.ClassDeclaration:
		case SyntaxKind.EnumDeclaration:
		case SyntaxKind.FunctionDeclaration:
		case SyntaxKind.InterfaceDeclaration:
		case SyntaxKind.ModuleDeclaration:
		case SyntaxKind.TypeAliasDeclaration:
		case SyntaxKind.VariableStatement:
			return hasExportModifier(node);
		case SyntaxKind.ExportAssignment:
		case SyntaxKind.ExportDeclaration:
		case SyntaxKind.ImportDeclaration:
		case SyntaxKind.ImportEqualsDeclaration:
			return true;
		default:
			return false;
	}
}

function isEmptyExport(node: AST.Statement) {
	if (node.kind !== SyntaxKind.ExportDeclaration) {
		return false;
	}

	const exportDeclaration = node;

	if (exportDeclaration.moduleSpecifier) {
		return false;
	}

	if (!exportDeclaration.exportClause) {
		return false;
	}

	if (exportDeclaration.exportClause.kind !== SyntaxKind.NamedExports) {
		return false;
	}

	const namedExports = exportDeclaration.exportClause;

	return namedExports.elements.length === 0;
}

export default ruleCreator.createRule(typescriptLanguage, {
	about: {
		description:
			"Reports empty export statements that don't change anything in a module file.",
		id: "emptyExports",
		presets: ["logical"],
	},
	messages: {
		uselessEmptyExport: {
			primary:
				"This empty export is unnecessary because the file already has other exports or imports.",
			secondary: [
				"An `export {}` statement is only useful to turn a script file into a module file when there are no other imports or exports.",
				"When the file already has imports or exports, the empty export does nothing.",
			],
			suggestions: ["Remove the empty export statement."],
		},
	},
	setup(context) {
		return {
			visitors: {
				SourceFile: (sourceFile) => {
					if (sourceFile.isDeclarationFile) {
						return;
					}

					const statements = sourceFile.statements;
					const emptyExports: AST.ExportDeclaration[] = [];
					let hasOtherModuleStatement = false;

					for (const statement of statements) {
						if (isEmptyExport(statement)) {
							emptyExports.push(statement as AST.ExportDeclaration);
						} else if (hasOtherExportOrImport(statement)) {
							hasOtherModuleStatement = true;
						}
					}

					if (!hasOtherModuleStatement) {
						return;
					}

					for (const emptyExport of emptyExports) {
						context.report({
							fix: {
								range: {
									begin: emptyExport.getStart(sourceFile),
									end: emptyExport.getEnd(),
								},
								text: "",
							},
							message: "uselessEmptyExport",
							range: {
								begin: emptyExport.getStart(sourceFile),
								end: emptyExport.getEnd(),
							},
						});
					}
				},
			},
		};
	},
});
