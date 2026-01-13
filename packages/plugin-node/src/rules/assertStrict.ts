import { type AST, getTSNodeRange, typescriptLanguage } from "@flint.fyi/ts";
import { SyntaxKind } from "typescript";

function isImportFromNodeAssert(expression: AST.Expression) {
	return (
		expression.kind === SyntaxKind.StringLiteral &&
		(expression.text === "assert" || expression.text === "node:assert")
	);
}

function isStrictAssertImport(expression: AST.Expression) {
	return (
		expression.kind === SyntaxKind.StringLiteral &&
		(expression.text === "assert/strict" ||
			expression.text === "node:assert/strict")
	);
}

export default typescriptLanguage.createRule({
	about: {
		description:
			"Prefer strict assertion mode from Node.js for better error messages and behavior.",
		id: "assertStrict",
		preset: "logical",
	},
	messages: {
		preferStrictAssert: {
			primary:
				"Prefer importing from `node:assert/strict` or using `{ strict as assert }` from `node:assert`.",
			secondary: [
				"In strict assertion mode, non-strict methods like `deepEqual()` behave like their strict counterparts (`deepStrictEqual()`).",
				"Strict mode provides better error messages with diffs and more reliable equality checks.",
			],
			suggestions: [
				"Import from `node:assert/strict` for strict assertion mode",
				"Use `import { strict as assert }` from `node:assert`",
			],
		},
	},
	setup(context) {
		return {
			visitors: {
				ImportDeclaration(node, { sourceFile }) {
					if (
						isStrictAssertImport(node.moduleSpecifier) ||
						!isImportFromNodeAssert(node.moduleSpecifier)
					) {
						return;
					}

					if (node.importClause) {
						if (node.importClause.namedBindings) {
							if (
								node.importClause.namedBindings.kind === SyntaxKind.NamedImports
							) {
								for (const element of node.importClause.namedBindings
									.elements) {
									const importedName =
										element.propertyName?.text ?? element.name.text;
									if (importedName === "strict") {
										return;
									}
								}
							}
						}

						context.report({
							message: "preferStrictAssert",
							range: getTSNodeRange(node.moduleSpecifier, sourceFile),
						});
					}
				},
				ImportEqualsDeclaration(node, { sourceFile }) {
					if (
						node.moduleReference.kind === SyntaxKind.ExternalModuleReference &&
						isImportFromNodeAssert(node.moduleReference.expression)
					) {
						context.report({
							message: "preferStrictAssert",
							range: getTSNodeRange(
								node.moduleReference.expression,
								sourceFile,
							),
						});
					}
				},
			},
		};
	},
});
