import ts, { SyntaxKind } from "typescript";

import { getTSNodeRange } from "../getTSNodeRange.ts";
import { typescriptLanguage } from "../language.ts";
import type * as AST from "../types/ast.ts";
import { ruleCreator } from "./ruleCreator.ts";

interface ImportInfo {
	declaration: AST.ImportDeclaration;
	moduleSpecifier: string;
	defaultImport?: string;
	namedImports: Map<string, string>;
	namespaceImport?: string;
}

interface ExportInfo {
	declaration: AST.ExportDeclaration;
	names: Set<string>;
}

function getImportInfo(
	node: AST.ImportDeclaration,
	sourceFile: ts.SourceFile,
): ImportInfo | undefined {
	if (!node.importClause) {
		return undefined;
	}

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

function isReExportedAsNamed(
	exportDecl: AST.ExportDeclaration,
	localName: string,
): boolean {
	if (!exportDecl.exportClause || !ts.isNamedExports(exportDecl.exportClause)) {
		return false;
	}

	for (const element of exportDecl.exportClause.elements) {
		const exportedLocalName = element.propertyName
			? element.propertyName.text
			: element.name.text;
		if (exportedLocalName === localName) {
			return true;
		}
	}

	return false;
}

function isDefaultExportOfImport(
	exportDecl: AST.ExportAssignment,
	defaultImportName: string,
): boolean {
	if (!exportDecl.expression) {
		return false;
	}

	if (ts.isIdentifier(exportDecl.expression)) {
		return exportDecl.expression.text === defaultImportName;
	}

	return false;
}

export default ruleCreator.createRule(typescriptLanguage, {
	about: {
		description:
			"Reports imports that are re-exported and could use export...from syntax instead.",
		id: "exportFromImports",
		presets: ["stylistic"],
	},
	messages: {
		preferExportFrom: {
			primary:
				"Prefer `export { {{ name }} } from '{{ module }}'` instead of separate import and export.",
			secondary: [
				"When re-exporting from a module, it's unnecessary to import and then export.",
				"Using `export...from` is more concise and makes the re-export intent clearer.",
			],
			suggestions: ["Use `export { {{ name }} } from '{{ module }}'` syntax."],
		},
		preferExportDefaultFrom: {
			primary:
				"Prefer `export { default } from '{{ module }}'` instead of separate import and export default.",
			secondary: [
				"When re-exporting a default export, you can use `export { default } from` syntax.",
				"This is more concise and makes the re-export intent clearer.",
			],
			suggestions: ["Use `export { default } from '{{ module }}'` syntax."],
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
						if (ts.isImportDeclaration(statement)) {
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
						}

						if (ts.isExportAssignment(statement) && !statement.isExportEquals) {
							exportAssignments.push(statement);
						}

						if (
							ts.isExportDeclaration(statement) &&
							!statement.moduleSpecifier
						) {
							namedExports.push(statement);
						}
					}

					for (const exportDecl of namedExports) {
						if (
							!exportDecl.exportClause ||
							!ts.isNamedExports(exportDecl.exportClause)
						) {
							continue;
						}

						for (const element of exportDecl.exportClause.elements) {
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

						if (!importInfo || importInfo.defaultImport !== localName) {
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
