import ts, { SyntaxKind } from "typescript";

import { typescriptLanguage } from "../language.ts";
import type * as AST from "../types/ast.ts";
import { getModifyingReferences } from "../utils/getModifyingReferences.ts";
import { ruleCreator } from "./ruleCreator.ts";

function collectBindingIdentifiers(name: AST.BindingName): AST.Identifier[] {
	if (name.kind === SyntaxKind.Identifier) {
		return [name];
	}

	const identifiers: AST.Identifier[] = [];

	for (const element of name.elements) {
		if (element.kind === SyntaxKind.BindingElement) {
			identifiers.push(...collectBindingIdentifiers(element.name));
		}
	}

	return identifiers;
}

export default ruleCreator.createRule(typescriptLanguage, {
	about: {
		description:
			"Reports variables declared with `let` that are never reassigned and could be `const`.",
		id: "constVariables",
		presets: ["logical"],
	},
	messages: {
		preferConst: {
			primary:
				"'{{ name }}' is never reassigned. Use `const` instead of `let`.",
			secondary: [
				"`const` declarations signal to readers that the variable will never be reassigned.",
				"This reduces cognitive load and makes code easier to understand.",
			],
			suggestions: [
				"Change `let` to `const` for this declaration.",
				"If you intend to reassign this variable later, keep `let`.",
			],
		},
	},
	setup(context) {
		return {
			visitors: {
				VariableDeclarationList: (node, { sourceFile, typeChecker }) => {
					if (
						node.flags & ts.NodeFlags.Const ||
						node.declarations.length === 0
					) {
						return;
					}

					const letKeyword = node
						.getChildren(sourceFile)
						.find((child) => child.kind === SyntaxKind.LetKeyword);

					if (!letKeyword) {
						return;
					}

					for (const declaration of node.declarations) {
						if (!declaration.initializer) {
							return;
						}

						const identifiers = collectBindingIdentifiers(declaration.name);

						for (const identifier of identifiers) {
							const modifyingReferences = getModifyingReferences(
								identifier,
								sourceFile,
								typeChecker,
							);

							if (modifyingReferences.length > 0) {
								return;
							}
						}
					}

					for (const declaration of node.declarations) {
						const identifiers = collectBindingIdentifiers(declaration.name);
						const firstIdentifier = identifiers[0];

						if (!firstIdentifier) {
							continue;
						}

						context.report({
							data: {
								name: firstIdentifier.text,
							},
							fix: {
								range: {
									begin: letKeyword.getStart(sourceFile),
									end: letKeyword.getEnd(),
								},
								text: "const",
							},
							message: "preferConst",
							range: {
								begin: firstIdentifier.getStart(sourceFile),
								end: firstIdentifier.getEnd(),
							},
						});
					}
				},
			},
		};
	},
});
