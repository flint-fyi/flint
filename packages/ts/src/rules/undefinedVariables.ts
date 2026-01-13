import { SyntaxKind } from "typescript";

import { typescriptLanguage } from "../language.ts";

export default typescriptLanguage.createRule({
	about: {
		description: "Reports using variables that are not defined.",
		id: "undefinedVariables",
		preset: "untyped",
	},
	messages: {
		undefinedVariable: {
			primary: "Variable '{{ name }}' is used but was never defined.",
			secondary: [
				"Variables must be declared before they can be used.",
				"Using undefined variables will cause a ReferenceError at runtime.",
			],
			suggestions: [
				"Declare the variable before using it, or check if the variable name is spelled correctly.",
			],
		},
	},
	setup(context) {
		return {
			visitors: {
				Identifier: (node, { sourceFile, typeChecker }) => {
					if (
						node.parent.kind === SyntaxKind.VariableDeclaration &&
						node.parent.name === node
					) {
						return;
					}

					if (
						node.parent.kind === SyntaxKind.Parameter &&
						node.parent.name === node
					) {
						return;
					}

					if (
						(node.parent.kind === SyntaxKind.FunctionDeclaration ||
							node.parent.kind === SyntaxKind.ClassDeclaration ||
							node.parent.kind === SyntaxKind.InterfaceDeclaration ||
							node.parent.kind === SyntaxKind.TypeAliasDeclaration ||
							node.parent.kind === SyntaxKind.EnumDeclaration ||
							node.parent.kind === SyntaxKind.ModuleDeclaration) &&
						node.parent.name === node
					) {
						return;
					}

					if (
						node.parent.kind === SyntaxKind.ImportSpecifier ||
						node.parent.kind === SyntaxKind.ImportClause ||
						node.parent.kind === SyntaxKind.NamespaceImport
					) {
						return;
					}

					if (
						node.parent.kind === SyntaxKind.PropertyAccessExpression &&
						node.parent.name === node
					) {
						return;
					}

					if (
						node.parent.kind === SyntaxKind.PropertyAssignment &&
						node.parent.name === node
					) {
						return;
					}

					if (
						node.parent.kind === SyntaxKind.TypeOfExpression &&
						node.parent.expression === node
					) {
						return;
					}

					// TODO: This rule is untyped, so it should use scope analysis
					// https://github.com/flint-fyi/flint/issues/400
					if (!typeChecker.getSymbolAtLocation(node)) {
						context.report({
							data: {
								name: node.text,
							},
							message: "undefinedVariable",
							range: {
								begin: node.getStart(sourceFile),
								end: node.getEnd(),
							},
						});
					}
				},
			},
		};
	},
});
