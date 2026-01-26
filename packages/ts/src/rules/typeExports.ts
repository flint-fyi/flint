import {
	getTSNodeRange,
	typescriptLanguage,
} from "@flint.fyi/typescript-language";
import ts from "typescript";

import { ruleCreator } from "./ruleCreator.ts";

export default ruleCreator.createRule(typescriptLanguage, {
	about: {
		description: "Reports exports that should use 'export type' syntax.",
		id: "typeExports",
		presets: ["stylistic"],
	},
	messages: {
		useExportType: {
			primary: "Use 'export type' for type-only exports.",
			secondary: [
				"This export only contains types, not runtime values.",
				"Using 'export type' improves tree-shaking and makes intent clear.",
			],
			suggestions: ["Change to 'export type { ... }'."],
		},
	},
	setup(context) {
		const typeOnlyImports = new Set<string>();

		return {
			visitors: {
				ImportDeclaration(node, { sourceFile }) {
					if (node.importClause?.isTypeOnly) {
						const namedBindings = node.importClause.namedBindings;
						if (namedBindings && ts.isNamedImports(namedBindings)) {
							for (const element of namedBindings.elements) {
								typeOnlyImports.add(element.name.text);
							}
						}
						if (node.importClause.name) {
							typeOnlyImports.add(node.importClause.name.text);
						}
					} else if (
						node.importClause?.namedBindings &&
						ts.isNamedImports(node.importClause.namedBindings)
					) {
						for (const element of node.importClause.namedBindings.elements) {
							if (element.isTypeOnly) {
								typeOnlyImports.add(element.name.text);
							}
						}
					}
				},
				ExportDeclaration(node, { sourceFile }) {
					if (node.isTypeOnly) {
						return;
					}

					if (!node.exportClause || !ts.isNamedExports(node.exportClause)) {
						return;
					}

					const allTypeOnly = node.exportClause.elements.every((element) => {
						if (element.isTypeOnly) {
							return true;
						}
						const exportedName =
							element.propertyName?.text ?? element.name.text;
						return typeOnlyImports.has(exportedName);
					});

					if (allTypeOnly && node.exportClause.elements.length > 0) {
						context.report({
							message: "useExportType",
							range: getTSNodeRange(node, sourceFile),
						});
					}
				},
			},
		};
	},
});
