import { SyntaxKind } from "typescript";

import { typescriptLanguage } from "../language.ts";
import * as AST from "../types/ast.ts";
import { getModifyingReferences } from "../utils/getModifyingReferences.ts";

export default typescriptLanguage.createRule({
	about: {
		description: "Reports reassigning exception parameters in catch clauses.",
		id: "exceptionAssignments",
		preset: "logical",
	},
	messages: {
		noExAssign: {
			primary:
				"Exception parameters in catch clauses should not be reassigned.",
			secondary: [
				"Reassigning an exception parameter can make debugging more difficult by obscuring the original error.",
				"The exception parameter contains important information about what went wrong, and reassigning it can make it harder to understand the root cause of an error.",
			],
			suggestions: [
				"Use a different variable name for the new value instead of reassigning the exception parameter.",
			],
		},
	},
	setup(context) {
		function collectBindingElements(name: AST.BindingName): AST.Identifier[] {
			const identifiers: AST.Identifier[] = [];

			if (name.kind == SyntaxKind.Identifier) {
				identifiers.push(name);
			} else {
				for (const element of name.elements) {
					if (element.kind === SyntaxKind.BindingElement) {
						identifiers.push(...collectBindingElements(element.name));
					}
				}
			}

			return identifiers;
		}

		return {
			visitors: {
				CatchClause: (node, { sourceFile, typeChecker }) => {
					if (!node.variableDeclaration?.name) {
						return;
					}

					const identifiers = collectBindingElements(
						node.variableDeclaration.name,
					);

					for (const identifier of identifiers) {
						const modifyingReferences = getModifyingReferences(
							identifier,
							sourceFile,
							typeChecker,
						);

						for (const reference of modifyingReferences) {
							context.report({
								message: "noExAssign",
								range: {
									begin: reference.getStart(sourceFile),
									end: reference.getEnd(),
								},
							});
						}
					}
				},
			},
		};
	},
});
