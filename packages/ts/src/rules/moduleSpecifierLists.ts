import {
	type AST,
	getTSNodeRange,
	typescriptLanguage,
} from "@flint.fyi/typescript-language";
import * as ts from "typescript";

import { ruleCreator } from "./ruleCreator.ts";

function hasNamedBindings(node: AST.ImportDeclaration) {
	const namedBindings = node.importClause?.namedBindings;
	if (!namedBindings) {
		return false;
	}

	return !ts.isNamedImports(namedBindings) || namedBindings.elements.length > 0;
}

function hasNamespaceImport(node: AST.ImportDeclaration) {
	const namedBindings = node.importClause?.namedBindings;
	return namedBindings && ts.isNamespaceImport(namedBindings);
}

function isEmptyNamedImports(node: AST.ImportDeclaration) {
	const namedBindings = node.importClause?.namedBindings;
	return (
		namedBindings &&
		ts.isNamedImports(namedBindings) &&
		namedBindings.elements.length === 0
	);
}

export default ruleCreator.createRule(typescriptLanguage, {
	about: {
		description:
			"Require non-empty specifier lists in import and export statements.",
		id: "moduleSpecifierLists",
		presets: ["logical", "logicalStrict"],
	},
	messages: {
		emptyExportSpecifiers: {
			primary: "Export statement with empty specifier list is unnecessary.",
			secondary: [
				"Empty export braces serve no purpose and can be removed.",
				"If re-exporting from a module, ensure you specify what to export.",
			],
			suggestions: ["Remove the empty export statement."],
		},
		emptyImportSpecifiers: {
			primary: "Import statement with empty specifier list is unnecessary.",
			secondary: [
				"Empty import braces serve no purpose and can confuse readers.",
				"Use a side-effect import if you only need to run the module's code.",
			],
			suggestions: [
				"Remove the empty braces or convert to a side-effect import.",
			],
		},
	},
	setup(context) {
		function createExportSuggestions(
			moduleSpecifier: AST.Expression,
			node: AST.ExportDeclaration,
			sourceFile: AST.SourceFile,
		) {
			const moduleSpecifierText = sourceFile.text.slice(
				moduleSpecifier.getStart(sourceFile),
				moduleSpecifier.getEnd(),
			);

			return [
				{
					id: "removeStatement",
					range: getTSNodeRange(node, sourceFile),
					text: "",
				},
				...(moduleSpecifierText
					? [
							{
								id: "convertToSideEffectImport",
								range: getTSNodeRange(node, sourceFile),
								text: `import ${moduleSpecifierText};`,
							},
						]
					: []),
			];
		}

		function createImportSuggestions(
			importClause: AST.ImportClause,
			node: AST.ImportDeclaration,
			sourceFile: AST.SourceFile,
		) {
			const moduleSpecifier = sourceFile.text.slice(
				node.moduleSpecifier.getStart(sourceFile),
				node.moduleSpecifier.getEnd(),
			);

			if (importClause.name) {
				const defaultImportName = importClause.name.getText(sourceFile);
				return [
					{
						id: "removeEmptyBraces",
						range: getTSNodeRange(node, sourceFile),
						text: `import ${defaultImportName} from ${moduleSpecifier};`,
					},
				];
			}

			return [
				{
					id: "removeStatement",
					range: getTSNodeRange(node, sourceFile),
					text: "",
				},
				...(importClause.phaseModifier === ts.SyntaxKind.TypeKeyword
					? []
					: [
							{
								id: "convertToSideEffectImport",
								range: getTSNodeRange(node, sourceFile),
								text: `import ${moduleSpecifier};`,
							},
						]),
			];
		}

		return {
			visitors: {
				ExportDeclaration: (node, { sourceFile }) => {
					if (
						node.moduleSpecifier === undefined ||
						!ts.isExportDeclaration(node) ||
						!node.exportClause ||
						!ts.isNamedExports(node.exportClause) ||
						node.exportClause.elements.length > 0
					) {
						return;
					}

					context.report({
						message: "emptyExportSpecifiers",
						range: getTSNodeRange(node, sourceFile),
						suggestions: createExportSuggestions(
							node.moduleSpecifier,
							node,
							sourceFile,
						),
					});
				},
				ImportDeclaration: (node, { sourceFile }) => {
					if (
						hasNamedBindings(node) ||
						hasNamespaceImport(node) ||
						!isEmptyNamedImports(node) ||
						!node.importClause
					) {
						return;
					}

					context.report({
						message: "emptyImportSpecifiers",
						range: getTSNodeRange(
							node.importClause.namedBindings ?? node.importClause,
							sourceFile,
						),
						suggestions: createImportSuggestions(
							node.importClause,
							node,
							sourceFile,
						),
					});
				},
			},
		};
	},
});
