import {
	type AST,
	getTSNodeRange,
	typescriptLanguage,
} from "@flint.fyi/typescript-language";
import ts, { SyntaxKind } from "typescript";

import { ruleCreator } from "./ruleCreator.ts";

const moduleIndicatorKinds = new Set([
	SyntaxKind.ExportAssignment,
	SyntaxKind.ExportDeclaration,
	SyntaxKind.ImportDeclaration,
	SyntaxKind.ImportEqualsDeclaration,
]);

function hasExportModifier(node: AST.Statement) {
	return !!(
		ts.canHaveModifiers(node) &&
		ts
			.getModifiers(node)
			?.some((modifier) => modifier.kind === SyntaxKind.ExportKeyword)
	);
}

function hasOtherModuleIndicator(statements: readonly AST.Statement[]) {
	return statements.some(
		(statement) =>
			hasExportModifier(statement) ||
			(moduleIndicatorKinds.has(statement.kind) &&
				!isEmptyNamedExport(statement)),
	);
}

function isEmptyNamedExport(
	node: AST.Statement,
): node is AST.ExportDeclaration {
	return !!(
		node.kind === SyntaxKind.ExportDeclaration &&
		!node.moduleSpecifier &&
		node.exportClause &&
		node.exportClause.kind === SyntaxKind.NamedExports &&
		!node.exportClause.elements.length
	);
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

				const range = getTSNodeRange(statement, sourceFile);

				context.report({
					fix: {
						range,
						text: "",
					},
					message: "uselessExport",
					range,
				});
			}
		}

		return {
			visitors: {
				ModuleBlock: (node, { sourceFile }) => {
					checkStatements(node.statements, sourceFile);
				},
				SourceFile: (node, { sourceFile }) => {
					if (!sourceFile.fileName.endsWith(".d.ts")) {
						checkStatements(node.statements, sourceFile);
					}
				},
			},
		};
	},
});
