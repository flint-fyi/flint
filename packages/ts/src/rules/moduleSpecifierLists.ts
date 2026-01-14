import * as ts from "typescript";

import { getTSNodeRange } from "../getTSNodeRange.ts";
import { typescriptLanguage } from "../language.ts";
import type * as AST from "../types/ast.ts";
import { ruleCreator } from "./ruleCreator.ts";

function hasNamedBindings(node: AST.ImportDeclaration) {
	const importClause = node.importClause;
	if (!importClause) {
		return false;
	}

	const namedBindings = importClause.namedBindings;
	if (!namedBindings) {
		return false;
	}

	if (ts.isNamedImports(namedBindings)) {
		return namedBindings.elements.length > 0;
	}

	return true;
}

function hasDefaultImport(node: AST.ImportDeclaration) {
	return node.importClause?.name !== undefined;
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
		presets: ["logical"],
	},
	messages: {
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
		emptyExportSpecifiers: {
			primary: "Export statement with empty specifier list is unnecessary.",
			secondary: [
				"Empty export braces serve no purpose and can be removed.",
				"If re-exporting from a module, ensure you specify what to export.",
			],
			suggestions: ["Remove the empty export statement."],
		},
	},
	setup(context) {
		return {
			visitors: {
				ExportDeclaration: (node, { sourceFile }) => {
					if (node.moduleSpecifier === undefined) {
						return;
					}

					if (!ts.isExportDeclaration(node)) {
						return;
					}

					const exportClause = node.exportClause;
					if (!exportClause) {
						return;
					}

					if (!ts.isNamedExports(exportClause)) {
						return;
					}

					if (exportClause.elements.length > 0) {
						return;
					}

					const moduleSpecifier = node.moduleSpecifier
						? sourceFile.text.slice(
								node.moduleSpecifier.getStart(sourceFile),
								node.moduleSpecifier.getEnd(),
							)
						: "";

					context.report({
						message: "emptyExportSpecifiers",
						range: getTSNodeRange(node, sourceFile),
						suggestions: [
							{
								id: "removeStatement",
								range: getTSNodeRange(node, sourceFile),
								text: "",
							},
							...(moduleSpecifier
								? [
										{
											id: "convertToSideEffectImport",
											range: getTSNodeRange(node, sourceFile),
											text: `import ${moduleSpecifier};`,
										},
									]
								: []),
						],
					});
				},
				ImportDeclaration: (node, { sourceFile }) => {
					if (hasNamedBindings(node) || hasNamespaceImport(node)) {
						return;
					}

					if (!isEmptyNamedImports(node)) {
						return;
					}

					const moduleSpecifier = sourceFile.text.slice(
						node.moduleSpecifier.getStart(sourceFile),
						node.moduleSpecifier.getEnd(),
					);

					if (hasDefaultImport(node)) {
						const defaultImportName =
							node.importClause!.name!.getText(sourceFile);

						context.report({
							message: "emptyImportSpecifiers",
							range: getTSNodeRange(
								node.importClause!.namedBindings!,
								sourceFile,
							),
							suggestions: [
								{
									id: "removeEmptyBraces",
									range: getTSNodeRange(node, sourceFile),
									text: `import ${defaultImportName} from ${moduleSpecifier};`,
								},
							],
						});
						return;
					}

					const isTypeImport = node.importClause?.isTypeOnly;
					if (isTypeImport) {
						context.report({
							message: "emptyImportSpecifiers",
							range: getTSNodeRange(
								node.importClause!.namedBindings!,
								sourceFile,
							),
							suggestions: [
								{
									id: "removeStatement",
									range: getTSNodeRange(node, sourceFile),
									text: "",
								},
							],
						});
						return;
					}

					context.report({
						message: "emptyImportSpecifiers",
						range: getTSNodeRange(
							node.importClause!.namedBindings!,
							sourceFile,
						),
						suggestions: [
							{
								id: "removeStatement",
								range: getTSNodeRange(node, sourceFile),
								text: "",
							},
							{
								id: "convertToSideEffectImport",
								range: getTSNodeRange(node, sourceFile),
								text: `import ${moduleSpecifier};`,
							},
						],
					});
				},
			},
		};
	},
});
