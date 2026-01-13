import ts, { SyntaxKind } from "typescript";

import { typescriptLanguage } from "../language.ts";
import * as AST from "../types/ast.ts";
import { getModifyingReferences } from "../utils/getModifyingReferences.ts";

export default typescriptLanguage.createRule({
	about: {
		description:
			"Reports attempting to reassign variables declared with const.",
		id: "constantAssignments",
		preset: "untyped",
	},
	messages: {
		noConstAssign: {
			primary:
				"Variables declared with const cannot be reassigned; use let or var instead if reassignment is needed.",
			secondary: [
				"The const keyword creates a read-only reference to a value, preventing reassignment.",
				"While properties of const objects and elements of const arrays can be mutated, the binding itself cannot be reassigned.",
			],
			suggestions: [
				"Use let instead of const if you need to reassign the variable.",
			],
		},
	},
	setup(context) {
		function collectBindingElements(name: AST.BindingName): AST.Identifier[] {
			if (name.kind == SyntaxKind.Identifier) {
				return [name];
			}

			const identifiers: AST.Identifier[] = [];

			for (const element of name.elements) {
				if (element.kind == SyntaxKind.BindingElement) {
					identifiers.push(...collectBindingElements(element.name));
				}
			}

			return identifiers;
		}

		return {
			visitors: {
				VariableDeclarationList: (node, { sourceFile, typeChecker }) => {
					if (
						!(node.flags & ts.NodeFlags.Const) ||
						node.declarations.length === 0
					) {
						return;
					}

					for (const declaration of node.declarations) {
						const identifiers = collectBindingElements(declaration.name);

						for (const identifier of identifiers) {
							const modifyingReferences = getModifyingReferences(
								identifier,
								sourceFile,
								typeChecker,
							);

							for (const reference of modifyingReferences) {
								context.report({
									message: "noConstAssign",
									range: {
										begin: reference.getStart(sourceFile),
										end: reference.getEnd(),
									},
								});
							}
						}
					}
				},
			},
		};
	},
});
