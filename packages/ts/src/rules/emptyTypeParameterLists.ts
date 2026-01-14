import ts from "typescript";

import { getTSNodeRange } from "../getTSNodeRange.ts";
import { typescriptLanguage } from "../language.ts";
import * as AST from "../types/ast.ts";
import { ruleCreator } from "./ruleCreator.ts";

function hasEmptyTypeParameters(
	typeParameters: ts.NodeArray<AST.TypeParameterDeclaration> | undefined,
) {
	return typeParameters?.length === 0;
}

export default ruleCreator.createRule(typescriptLanguage, {
	about: {
		description:
			"Reports empty type parameter lists in type aliases and interfaces.",
		id: "emptyTypeParameterLists",
		presets: ["stylistic"],
	},
	messages: {
		emptyTypeParameters: {
			primary: "Empty type parameter lists are not allowed.",
			secondary: [
				"TypeScript permits empty type parameter lists like `<>`, but this practice is discouraged.",
				"Empty type parameter lists can lead to unclear or ambiguous code.",
			],
			suggestions: [
				"Remove the empty type parameter list, or add type parameters if needed.",
			],
		},
	},
	setup(context) {
		return {
			visitors: {
				InterfaceDeclaration: (node, { sourceFile }) => {
					if (!hasEmptyTypeParameters(node.typeParameters)) {
						return;
					}

					context.report({
						message: "emptyTypeParameters",
						range: getTSNodeRange(node, sourceFile),
					});
				},
				TypeAliasDeclaration: (node, { sourceFile }) => {
					if (!hasEmptyTypeParameters(node.typeParameters)) {
						return;
					}

					context.report({
						message: "emptyTypeParameters",
						range: getTSNodeRange(node, sourceFile),
					});
				},
			},
		};
	},
});
