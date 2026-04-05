import {
	getTSNodeRange,
	typescriptLanguage,
} from "@flint.fyi/typescript-language";
import ts from "typescript";

import { ruleCreator } from "./ruleCreator.ts";

export default ruleCreator.createRule(typescriptLanguage, {
	about: {
		description:
			"Allows enforcing that type-only exports should use `export type` syntax.",
		id: "typeExports",
		presets: ["stylistic"],
	},
	messages: {
		useExportType: {
			primary: "Prefer `export type` for type-only exports.",
			secondary: [
				"This export only contains types, not runtime values.",
				"Type-only exports can be explicitly indicated with `export type`.",
				"This project is set to enforce using `export type` when possible.",
			],
			suggestions: ["Change to `export type { ... }`."],
		},
	},
	setup(context) {
		const typeOnlyImports = new Set<string>();

		return {
			visitors: {
				ExportDeclaration(node, { sourceFile }) {
					if (
						!node.isTypeOnly &&
						node.exportClause?.kind === ts.SyntaxKind.NamedExports &&
						node.exportClause.elements.every(
							(element) =>
								element.isTypeOnly ||
								typeOnlyImports.has(
									element.propertyName?.text ?? element.name.text,
								),
						)
					) {
						context.report({
							message: "useExportType",
							range: getTSNodeRange(node, sourceFile),
						});
					}
				},
				ImportDeclaration(node) {
					if (!node.importClause) {
						return;
					}

					if (node.importClause.isTypeOnly) {
						if (
							node.importClause.namedBindings?.kind ===
							ts.SyntaxKind.NamedImports
						) {
							for (const element of node.importClause.namedBindings.elements) {
								typeOnlyImports.add(element.name.text);
							}
						}
						if (node.importClause.name) {
							typeOnlyImports.add(node.importClause.name.text);
						}
					} else if (
						node.importClause.namedBindings?.kind === ts.SyntaxKind.NamedImports
					) {
						for (const element of node.importClause.namedBindings.elements) {
							if (element.isTypeOnly) {
								typeOnlyImports.add(element.name.text);
							}
						}
					}
				},
			},
		};
	},
});
