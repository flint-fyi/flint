import ts, { SyntaxKind } from "typescript";
import { z } from "zod";

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
			"Reports modules that have only one named export but no default export.",
		id: "exportDefault",
		presets: ["stylistic"],
	},
	messages: {
		preferDefault: {
			primary:
				"A single named export was found. Prefer using a default export when there is only one export.",
			secondary: [
				"When a module has only one export, using a default export can make imports more concise.",
			],
			suggestions: [
				"Add `default` to the export, or use `export default` with the value.",
			],
		},
	},
	options: {
		target: z
			.enum(["single", "any"])
			.default("single")
			.describe(
				'When "single", only flags modules with exactly one export. When "any", flags any module without a default export.',
			),
	},
	setup(context) {
		return {
			visitors: {
				SourceFile: (sourceFile, { options: { target } }) => {
					let hasDefaultExport = false;
					const namedExports: ts.Node[] = [];

					for (const statement of sourceFile.statements) {
						switch (statement.kind) {
							case SyntaxKind.ClassDeclaration:
							case SyntaxKind.FunctionDeclaration: {
								const decl = statement as
									| ts.ClassDeclaration
									| ts.FunctionDeclaration;
								if (hasExportModifier(decl.modifiers)) {
									if (hasDefaultModifier(decl.modifiers)) {
										hasDefaultExport = true;
									} else {
										namedExports.push(decl);
									}
								}
								break;
							}

							case SyntaxKind.EnumDeclaration:
							case SyntaxKind.InterfaceDeclaration:
							case SyntaxKind.TypeAliasDeclaration: {
								break;
							}

							case SyntaxKind.ExportAssignment:
								if (!statement.isExportEquals) {
									hasDefaultExport = true;
								}
								break;

							case SyntaxKind.ExportDeclaration: {
								const exportDecl = statement as ts.ExportDeclaration;
								if (exportDecl.exportClause) {
									if (ts.isNamespaceExport(exportDecl.exportClause)) {
										namedExports.push(exportDecl);
									} else if (ts.isNamedExports(exportDecl.exportClause)) {
										if (exportDecl.isTypeOnly) {
											continue;
										}
										for (const specifier of exportDecl.exportClause.elements) {
											if (specifier.isTypeOnly) {
												continue;
											}
											namedExports.push(specifier);
										}
									}
								}
								break;
							}

							case SyntaxKind.VariableStatement: {
								const varStmt = statement as ts.VariableStatement;
								if (hasExportModifier(varStmt.modifiers)) {
									for (const decl of varStmt.declarationList.declarations) {
										namedExports.push(decl);
									}
								}
								break;
							}
						}
					}

					if (hasDefaultExport) {
						return;
					}

					if (namedExports.length === 0) {
						return;
					}

					if (target === "single" && namedExports.length !== 1) {
						return;
					}

					const firstExport = namedExports[0];
					if (!firstExport) {
						return;
					}

					context.report({
						message: "preferDefault",
						range: getTSNodeRange(firstExport, sourceFile),
					});
				},
			},
		};
	},
});
