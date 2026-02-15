import {
	type AST,
	getTSNodeRange,
	typescriptLanguage,
} from "@flint.fyi/typescript-language";
import ts from "typescript";

import { ruleCreator } from "./ruleCreator.ts";

interface ImportInfo {
	declaration: AST.ImportDeclaration;
	defaultImport?: string;
	moduleSpecifier: string;
	namedImports: Map<string, string>;
	namespaceImport?: string;
}

function getImportInfo(
	node: AST.ImportDeclaration,
	sourceFile: ts.SourceFile,
): ImportInfo | undefined {
	if (!node.importClause) {
		return undefined;
	}

	// TODO: Use a util like getStaticValue
	// https://github.com/flint-fyi/flint/issues/1298
	const moduleSpecifier = ts.isStringLiteral(node.moduleSpecifier)
		? node.moduleSpecifier.text
		: node.moduleSpecifier.getText(sourceFile);

	const info: ImportInfo = {
		declaration: node,
		moduleSpecifier,
		namedImports: new Map(),
	};

	const clause = node.importClause;

	if (clause.name) {
		info.defaultImport = clause.name.text;
	}

	if (clause.namedBindings) {
		if (ts.isNamespaceImport(clause.namedBindings)) {
			info.namespaceImport = clause.namedBindings.name.text;
		} else if (ts.isNamedImports(clause.namedBindings)) {
			for (const element of clause.namedBindings.elements) {
				const importedName = element.propertyName
					? element.propertyName.text
					: element.name.text;
				const localName = element.name.text;
				info.namedImports.set(localName, importedName);
			}
		}
	}

	return info;
}

export default ruleCreator.createRule(typescriptLanguage, {
	about: {
		description:
			"Reports imports that are re-exported and could use export...from syntax instead.",
		id: "exportFromImports",
		presets: ["stylistic", "stylisticStrict"],
	},
	messages: {
		preferExportDefaultFrom: {
			primary:
				"Prefer `export { default } from '{{ module }}'` instead of separate import and export default.",
			secondary: [
				"When re-exporting a default export, you can use `export { default } from` syntax.",
				"This is more concise and makes the re-export intent clearer.",
			],
			suggestions: ["Use `export { default } from '{{ module }}'` syntax."],
		},
		preferExportFrom: {
			primary:
				"Prefer `export { {{ name }} } from '{{ module }}'` instead of separate import and export.",
			secondary: [
				"When re-exporting from a module, it's unnecessary to import and then export.",
				"Using `export...from` is more concise and makes the re-export intent clearer.",
			],
			suggestions: ["Use `export { {{ name }} } from '{{ module }}'` syntax."],
		},
		preferExportNamespaceFrom: {
			primary:
				"Prefer `export * as {{ name }} from '{{ module }}'` instead of separate import and export.",
			secondary: [
				"When re-exporting a namespace, you can use `export * as` syntax.",
				"This is more concise and makes the re-export intent clearer.",
			],
			suggestions: ["Use `export * as {{ name }} from '{{ module }}'` syntax."],
		},
	},
	setup(context) {
		return {
			visitors: {
				SourceFile: (node, { sourceFile }) => {
					const imports = new Map<string, ImportInfo>();
					const exportAssignments: AST.ExportAssignment[] = [];
					const namedExports: AST.ExportDeclaration[] = [];

					for (const statement of node.statements) {
						switch (statement.kind) {
							case ts.SyntaxKind.ExportAssignment:
								if (!statement.isExportEquals) {
									exportAssignments.push(statement);
								}
								break;

							case ts.SyntaxKind.ExportDeclaration:
								if (!statement.moduleSpecifier) {
									namedExports.push(statement);
								}
								break;

							case ts.SyntaxKind.ImportDeclaration: {
								const info = getImportInfo(statement, sourceFile);
								if (info) {
									if (info.defaultImport) {
										imports.set(info.defaultImport, info);
									}
									for (const [localName] of info.namedImports) {
										imports.set(localName, info);
									}
									if (info.namespaceImport) {
										imports.set(info.namespaceImport, info);
									}
								}
								break;
							}
						}
					}

					for (const exportDeclaration of namedExports) {
						if (
							!exportDeclaration.exportClause ||
							!ts.isNamedExports(exportDeclaration.exportClause)
						) {
							continue;
						}

						for (const element of exportDeclaration.exportClause.elements) {
							const localName = element.propertyName
								? element.propertyName.text
								: element.name.text;
							const exportedName = element.name.text;

							const importInfo = imports.get(localName);
							if (!importInfo) {
								continue;
							}

							if (importInfo.namedImports.has(localName)) {
								context.report({
									data: {
										module: importInfo.moduleSpecifier,
										name: exportedName,
									},
									message: "preferExportFrom",
									range: getTSNodeRange(element, sourceFile),
								});
							} else if (importInfo.namespaceImport === localName) {
								context.report({
									data: {
										module: importInfo.moduleSpecifier,
										name: exportedName,
									},
									message: "preferExportNamespaceFrom",
									range: getTSNodeRange(element, sourceFile),
								});
							} else if (importInfo.defaultImport === localName) {
								context.report({
									data: {
										module: importInfo.moduleSpecifier,
										name: exportedName,
									},
									message: "preferExportFrom",
									range: getTSNodeRange(element, sourceFile),
								});
							}
						}
					}

					for (const exportAssignment of exportAssignments) {
						if (!ts.isIdentifier(exportAssignment.expression)) {
							continue;
						}

						const localName = exportAssignment.expression.text;
						const importInfo = imports.get(localName);

						if (importInfo?.defaultImport !== localName) {
							continue;
						}

						context.report({
							data: {
								module: importInfo.moduleSpecifier,
							},
							message: "preferExportDefaultFrom",
							range: getTSNodeRange(exportAssignment, sourceFile),
						});
					}
				},
			},
		};
	},
});
