import ts, { SyntaxKind } from "typescript";

import { getTSNodeRange } from "../getTSNodeRange.ts";
import { typescriptLanguage } from "../language.ts";
import { ruleCreator } from "./ruleCreator.ts";

function hasExportModifier(
	modifiers: ts.NodeArray<ts.ModifierLike> | undefined,
) {
	return modifiers?.some((mod) => mod.kind === SyntaxKind.ExportKeyword);
}

function isExportStatement(statement: ts.Statement) {
	switch (statement.kind) {
		case SyntaxKind.ClassDeclaration:
		case SyntaxKind.FunctionDeclaration: {
			const decl = statement as ts.ClassDeclaration | ts.FunctionDeclaration;
			return hasExportModifier(decl.modifiers);
		}

		case SyntaxKind.ExportAssignment:
		case SyntaxKind.ExportDeclaration:
			return true;

		case SyntaxKind.VariableStatement: {
			const varStmt = statement as ts.VariableStatement;
			return hasExportModifier(varStmt.modifiers);
		}

		default:
			return false;
	}
}

export default ruleCreator.createRule(typescriptLanguage, {
	about: {
		description:
			"Reports export declarations that come before non-export statements.",
		id: "exportLast",
		presets: ["stylistic"],
	},
	messages: {
		exportLast: {
			primary: "Export statement should be at the end of the file.",
			secondary: [
				"Exports scattered throughout the file make it harder to see what a module provides.",
				"Moving all exports to the end of the file improves code readability.",
			],
			suggestions: ["Move this export to the end of the file."],
		},
	},
	setup(context) {
		return {
			visitors: {
				SourceFile: (sourceFile) => {
					let lastNonExportIndex = -1;

					for (let i = sourceFile.statements.length - 1; i >= 0; i--) {
						const statement = sourceFile.statements[i];
						if (!statement || isExportStatement(statement)) {
							continue;
						}
						lastNonExportIndex = i;
						break;
					}

					if (lastNonExportIndex === -1) {
						return;
					}

					for (let i = 0; i < lastNonExportIndex; i++) {
						const statement = sourceFile.statements[i];
						if (!statement || !isExportStatement(statement)) {
							continue;
						}

						context.report({
							message: "exportLast",
							range: getTSNodeRange(statement, sourceFile),
						});
					}
				},
			},
		};
	},
});
