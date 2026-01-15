import {
	type AST,
	getTSNodeRange,
	typescriptLanguage,
} from "@flint.fyi/typescript-language";
import ts, { SyntaxKind } from "typescript";

import { ruleCreator } from "./ruleCreator.ts";

function hasDefaultModifier(
	modifiers: ts.NodeArray<AST.ModifierLike> | undefined,
) {
	return modifiers?.some((mod) => mod.kind === SyntaxKind.DefaultKeyword);
}

function hasExportModifier(
	modifiers: ts.NodeArray<AST.ModifierLike> | undefined,
) {
	return modifiers?.some((mod) => mod.kind === SyntaxKind.ExportKeyword);
}

export default ruleCreator.createRule(typescriptLanguage, {
	about: {
		description: "Reports duplicate export names in a module.",
		id: "exportUniqueNames",
		presets: ["untyped"],
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
				SourceFile: (node, { sourceFile }) => {
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

					function checkClassOrFunctionDeclaration(
						statement: AST.ClassDeclaration | AST.FunctionDeclaration,
					) {
						if (
							hasExportModifier(statement.modifiers) &&
							!hasDefaultModifier(statement.modifiers) &&
							statement.name
						) {
							checkAndReportDuplicate(statement.name.text, statement.name);
						}
					}

					function checkExportDeclaration(statement: AST.ExportDeclaration) {
						if (
							statement.exportClause &&
							ts.isNamedExports(statement.exportClause) &&
							!statement.isTypeOnly
						) {
							for (const specifier of statement.exportClause.elements) {
								if (specifier.isTypeOnly) {
									continue;
								}
								const exportedName = specifier.name.text;
								checkAndReportDuplicate(exportedName, specifier.name);
							}
						}
					}

					function checkVariableStatement(statement: AST.VariableStatement) {
						if (!hasExportModifier(statement.modifiers)) {
							return;
						}

						for (const declaration of statement.declarationList.declarations) {
							if (ts.isIdentifier(declaration.name)) {
								checkAndReportDuplicate(
									declaration.name.text,
									declaration.name,
								);
							}
						}
					}

					for (const statement of node.statements) {
						switch (statement.kind) {
							case SyntaxKind.ClassDeclaration:
							case SyntaxKind.FunctionDeclaration:
								checkClassOrFunctionDeclaration(statement);
								break;

							case SyntaxKind.ExportDeclaration:
								checkExportDeclaration(statement);
								break;

							case SyntaxKind.VariableStatement:
								checkVariableStatement(statement);
								break;
						}
					}
				},
			},
		};
	},
});
