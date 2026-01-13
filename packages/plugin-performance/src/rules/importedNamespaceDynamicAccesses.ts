import {
	type AST,
	type Checker,
	getTSNodeRange,
	typescriptLanguage,
} from "@flint.fyi/ts";
import ts, { SyntaxKind } from "typescript";

export default typescriptLanguage.createRule({
	about: {
		description:
			"Disallow computed member access on imported namespace identifiers.",
		id: "importedNamespaceDynamicAccesses",
	},
	messages: {
		noDynamicAccess: {
			primary:
				"Avoid computed member access on namespace imports as it prevents tree-shaking optimizations.",
			secondary: [
				"Dynamic property access on namespace imports prevents bundlers from determining which exports are used.",
				"This results in the entire module being included in the bundle instead of just the parts you use.",
			],
			suggestions: [
				"Use static property access (e.g., `namespace.property`) instead of computed access (e.g., `namespace[property]`).",
				"If you need dynamic access, import individual exports instead of using a namespace import.",
			],
		},
	},
	setup(context) {
		function isNamespaceImportDeclaration(declaration: ts.Declaration) {
			return (
				declaration.kind === SyntaxKind.NamespaceImport &&
				declaration.parent.kind === SyntaxKind.ImportClause &&
				declaration.parent.parent.kind === SyntaxKind.ImportDeclaration
			);
		}

		function isIdentifierNamespaceImport(
			identifier: AST.Identifier,
			typeChecker: Checker,
		) {
			return typeChecker
				.getSymbolAtLocation(identifier)
				?.getDeclarations()
				?.some(isNamespaceImportDeclaration);
		}

		return {
			visitors: {
				ElementAccessExpression(node, { sourceFile, typeChecker }) {
					if (
						node.expression.kind === SyntaxKind.Identifier &&
						isIdentifierNamespaceImport(node.expression, typeChecker)
					) {
						context.report({
							message: "noDynamicAccess",
							range: getTSNodeRange(node, sourceFile),
						});
					}
				},
			},
		};
	},
});
