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
		description: "Reports duplicate export names in a module.",
		id: "exportUniqueNames",
		presets: ["logical"],
	},
	messages: {
		duplicateExport: {
			primary: "Duplicate export '{{ name }}' found.",
			secondary: [
				"Having multiple exports with the same name creates ambiguity about which value is exported.",
			],
			suggestions: ["Remove or rename one of the duplicate exports."],
		},
	},
	setup(context) {
		return {
			visitors: {
				SourceFile: (sourceFile) => {
					const exportedNames = new Map<string, ts.Node>();

					function checkAndReportDuplicate(name: string, node: ts.Node) {
						const existing = exportedNames.get(name);
						if (existing) {
							context.report({
								data: { name },
								message: "duplicateExport",
								range: getTSNodeRange(node, sourceFile),
							});
						} else {
							exportedNames.set(name, node);
						}
					}

					for (const statement of sourceFile.statements) {
						switch (statement.kind) {
							case SyntaxKind.ClassDeclaration:
							case SyntaxKind.FunctionDeclaration: {
								const decl = statement as
									| ts.ClassDeclaration
									| ts.FunctionDeclaration;
								if (
									hasExportModifier(decl.modifiers) &&
									!hasDefaultModifier(decl.modifiers) &&
									decl.name
								) {
									checkAndReportDuplicate(decl.name.text, decl.name);
								}
								break;
							}

							case SyntaxKind.ExportDeclaration: {
								const exportDecl = statement as ts.ExportDeclaration;
								if (
									exportDecl.exportClause &&
									ts.isNamedExports(exportDecl.exportClause) &&
									!exportDecl.isTypeOnly
								) {
									for (const specifier of exportDecl.exportClause.elements) {
										if (specifier.isTypeOnly) {
											continue;
										}
										const exportedName = specifier.name.text;
										checkAndReportDuplicate(exportedName, specifier.name);
									}
								}
								break;
							}

							case SyntaxKind.VariableStatement: {
								const varStmt = statement as ts.VariableStatement;
								if (hasExportModifier(varStmt.modifiers)) {
									for (const decl of varStmt.declarationList.declarations) {
										if (ts.isIdentifier(decl.name)) {
											checkAndReportDuplicate(decl.name.text, decl.name);
										}
									}
								}
								break;
							}
						}
					}
				},
			},
		};
	},
});
