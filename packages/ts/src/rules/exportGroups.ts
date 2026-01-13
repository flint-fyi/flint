import ts, { SyntaxKind } from "typescript";

import { getTSNodeRange } from "../getTSNodeRange.ts";
import { typescriptLanguage } from "../language.ts";
import { ruleCreator } from "./ruleCreator.ts";

function hasDefaultModifier(
	modifiers: ts.NodeArray<ts.ModifierLike> | undefined,
) {
	return modifiers?.some((mod) => mod.kind === SyntaxKind.DefaultKeyword);
}

function hasExportModifier(
	modifiers: ts.NodeArray<ts.ModifierLike> | undefined,
) {
	return modifiers?.some((mod) => mod.kind === SyntaxKind.ExportKeyword);
}

export default ruleCreator.createRule(typescriptLanguage, {
	about: {
		description:
			"Reports when named exports are not grouped together in a single export statement.",
		id: "exportGroups",
		presets: ["stylistic"],
	},
	messages: {
		groupExports: {
			primary:
				"Multiple named exports found. Group all named exports in a single export statement.",
			secondary: [
				"Having exports scattered across a file makes it harder to see what a module provides.",
				"Grouping all named exports in one place improves readability.",
			],
			suggestions: [
				"Move all named exports to a single `export { ... }` statement at the end of the file.",
			],
		},
	},
	setup(context) {
		return {
			visitors: {
				SourceFile: (sourceFile) => {
					const exportStatements: ts.Node[] = [];

					for (const statement of sourceFile.statements) {
						switch (statement.kind) {
							case SyntaxKind.ClassDeclaration:
							case SyntaxKind.FunctionDeclaration: {
								const decl = statement as
									| ts.ClassDeclaration
									| ts.FunctionDeclaration;
								if (
									hasExportModifier(decl.modifiers) &&
									!hasDefaultModifier(decl.modifiers)
								) {
									exportStatements.push(decl);
								}
								break;
							}

							case SyntaxKind.ExportDeclaration: {
								const exportDecl = statement as ts.ExportDeclaration;
								if (
									exportDecl.exportClause &&
									ts.isNamedExports(exportDecl.exportClause) &&
									!exportDecl.moduleSpecifier &&
									!exportDecl.isTypeOnly
								) {
									exportStatements.push(exportDecl);
								}
								break;
							}

							case SyntaxKind.VariableStatement: {
								const varStmt = statement as ts.VariableStatement;
								if (hasExportModifier(varStmt.modifiers)) {
									exportStatements.push(varStmt);
								}
								break;
							}
						}
					}

					if (exportStatements.length <= 1) {
						return;
					}

					const firstExport = exportStatements[1];
					if (!firstExport) {
						return;
					}

					context.report({
						message: "groupExports",
						range: getTSNodeRange(firstExport, sourceFile),
					});
				},
			},
		};
	},
});
