import {
	getTSNodeRange,
	typescriptLanguage,
} from "@flint.fyi/typescript-language";
import ts from "typescript";

import { ruleCreator } from "./ruleCreator.ts";

export default ruleCreator.createRule(typescriptLanguage, {
	about: {
		description: "Reports imports that should use 'import type' syntax.",
		id: "typeImports",
		presets: ["stylistic"],
	},
	messages: {
		useImportType: {
			primary: "Use 'import type' for type-only imports.",
			secondary: [
				"This import is only used in type positions.",
				"Using 'import type' improves tree-shaking and makes intent clear.",
			],
			suggestions: ["Change to 'import type { ... }'."],
		},
	},
	setup(context) {
		return {
			visitors: {
				SourceFile(node, { sourceFile }) {
					const importedNames = new Map<
						string,
						{ node: ts.ImportDeclaration; isTypeOnly: boolean }
					>();
					const valueUsages = new Set<string>();

					function collectImports(tsNode: ts.Node) {
						if (ts.isImportDeclaration(tsNode) && tsNode.importClause) {
							if (tsNode.importClause.isTypeOnly) {
								return;
							}

							const namedBindings = tsNode.importClause.namedBindings;
							if (namedBindings && ts.isNamedImports(namedBindings)) {
								for (const element of namedBindings.elements) {
									if (!element.isTypeOnly) {
										importedNames.set(element.name.text, {
											node: tsNode,
											isTypeOnly: false,
										});
									}
								}
							}

							if (tsNode.importClause.name) {
								importedNames.set(tsNode.importClause.name.text, {
									node: tsNode,
									isTypeOnly: false,
								});
							}
						}
					}

					function isInTypeContext(tsNode: ts.Node): boolean {
						let current: ts.Node | undefined = tsNode;
						while (current) {
							if (ts.isHeritageClause(current)) {
								return current.token === ts.SyntaxKind.ImplementsKeyword;
							}
							if (
								ts.isTypeAliasDeclaration(current) ||
								ts.isInterfaceDeclaration(current) ||
								ts.isTypeParameterDeclaration(current)
							) {
								return true;
							}
							if (
								ts.isTypeNode(current) &&
								!ts.isExpressionWithTypeArguments(current)
							) {
								return true;
							}
							current = current.parent;
						}
						return false;
					}

					function checkValueUsages(tsNode: ts.Node) {
						if (ts.isIdentifier(tsNode) && importedNames.has(tsNode.text)) {
							if (!isInTypeContext(tsNode)) {
								if (
									tsNode.parent &&
									!ts.isImportSpecifier(tsNode.parent) &&
									!ts.isImportClause(tsNode.parent)
								) {
									valueUsages.add(tsNode.text);
								}
							}
						}
						ts.forEachChild(tsNode, checkValueUsages);
					}

					ts.forEachChild(sourceFile, collectImports);
					ts.forEachChild(sourceFile, checkValueUsages);

					const reportedDeclarations = new Set<ts.ImportDeclaration>();

					for (const [name, info] of importedNames) {
						if (
							!valueUsages.has(name) &&
							!reportedDeclarations.has(info.node)
						) {
							const clause = info.node.importClause;
							if (
								clause?.namedBindings &&
								ts.isNamedImports(clause.namedBindings)
							) {
								const allTypeOnly = clause.namedBindings.elements.every(
									(el) => !valueUsages.has(el.name.text) || el.isTypeOnly,
								);
								if (allTypeOnly && !clause.name) {
									reportedDeclarations.add(info.node);
									context.report({
										message: "useImportType",
										range: getTSNodeRange(info.node, sourceFile),
									});
								}
							}
						}
					}
				},
			},
		};
	},
});
