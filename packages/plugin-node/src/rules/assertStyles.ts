import { getTSNodeRange, typescriptLanguage } from "@flint.fyi/ts";
import { SyntaxKind } from "typescript";

function isAssertImport(importName: string) {
	return (
		importName === "assert" ||
		importName === "assert/strict" ||
		importName === "node:assert" ||
		importName === "node:assert/strict"
	);
}

export default typescriptLanguage.createRule({
	about: {
		description:
			"Prefer `assert.ok()` over `assert()` for explicit intent and better readability.",
		id: "assertStyles",
		preset: "stylistic",
	},
	messages: {
		preferAssertOk: {
			primary:
				"Prefer `assert.ok()` over `assert()` for explicit intent and better readability.",
			secondary: [
				"Using `assert.ok()` aligns with other assert methods, ensuring consistency and making code easier to maintain and understand.",
				"The explicit method call clarifies the assertion's purpose.",
			],
			suggestions: [
				"Use `assert.ok()` instead of calling `assert()` directly.",
			],
		},
	},
	setup(context) {
		const assertIdentifierNames = new Set<string>();

		return {
			visitors: {
				CallExpression(node, { sourceFile }) {
					if (
						node.expression.kind === SyntaxKind.Identifier &&
						assertIdentifierNames.has(node.expression.text)
					) {
						context.report({
							message: "preferAssertOk",
							range: getTSNodeRange(node.expression, sourceFile),
						});
					}
				},
				ImportDeclaration(node) {
					if (
						node.moduleSpecifier.kind !== SyntaxKind.StringLiteral ||
						!isAssertImport(node.moduleSpecifier.text) ||
						!node.importClause
					) {
						return;
					}

					if (node.importClause.name) {
						assertIdentifierNames.add(node.importClause.name.text);
					}

					if (node.importClause.namedBindings) {
						if (
							node.importClause.namedBindings.kind === SyntaxKind.NamedImports
						) {
							for (const element of node.importClause.namedBindings.elements) {
								const importedName =
									element.propertyName?.text ?? element.name.text;
								if (importedName === "strict") {
									assertIdentifierNames.add(element.name.text);
								}
							}
						} else {
							assertIdentifierNames.add(
								node.importClause.namedBindings.name.text,
							);
						}
					}
				},
				ImportEqualsDeclaration(node) {
					if (
						node.moduleReference.kind === SyntaxKind.ExternalModuleReference &&
						node.moduleReference.expression.kind === SyntaxKind.StringLiteral &&
						isAssertImport(node.moduleReference.expression.text)
					) {
						assertIdentifierNames.add(node.name.text);
					}
				},
			},
		};
	},
});
