import { SyntaxKind } from "typescript-native/unstable/ast";

import {
	getTSNodeRange,
	typescriptLanguage,
	type AST,
	type Checker,
	type TypeScriptFileServices,
} from "@flint.fyi/typescript-language";

import { ruleCreator } from "../ruleCreator.ts";

export default ruleCreator.createRule(typescriptLanguage, {
	about: {
		description:
			"Disallow computed member access on imported namespace identifiers.",
		id: "importedNamespaceDynamicAccesses",
		presets: ["logical"],
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
		function isNamespaceImportDeclaration(declaration: AST.AnyNode): boolean {
			return (
				declaration.kind === SyntaxKind.NamespaceImport &&
				declaration.parent.kind === SyntaxKind.ImportClause &&
				declaration.parent.parent.kind === SyntaxKind.ImportDeclaration
			);
		}

		function isIdentifierNamespaceImport(
			identifier: AST.Identifier,
			typeChecker: Checker,
		): boolean | undefined {
			const declarations =
				typeChecker.getSymbolAtLocation(identifier)?.declarations;
			if (!declarations) {
				return undefined;
			}

			const resolvedDeclarations = declarations.map(
				(declaration) => declaration.resolve() as AST.AnyNode | undefined,
			);
			if (resolvedDeclarations.some((declaration) => !declaration)) {
				return false;
			}

			return resolvedDeclarations.some(
				(declaration) =>
					!!declaration && isNamespaceImportDeclaration(declaration),
			);
		}

		return {
			visitors: {
				ElementAccessExpression(
					node,
					{ typeChecker, sourceFile }: TypeScriptFileServices,
				) {
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
