import { typescriptLanguage } from "@flint.fyi/typescript-language";
import ts, { SyntaxKind } from "typescript";

import { ruleCreator } from "./ruleCreator.ts";

export default ruleCreator.createRule(typescriptLanguage, {
	about: {
		description:
			"Reports variables declared without type annotation or initializer.",
		id: "evolvingVariableTypes",
		presets: ["stylisticStrict"],
	},
	messages: {
		implicitAny: {
			primary:
				"Variable '{{ name }}' has an implicit evolving 'any' type due to missing type annotation and initializer.",
			secondary: [
				"Variables declared without a type annotation or initial value implicitly have the 'any' type.",
				"This allows any type of value to be assigned to the variable, which can make it harder to catch type-related bugs at compile time.",
			],
			suggestions: [
				"Add a type annotation to the variable declaration.",
				"Initialize the variable with a value so TypeScript can infer its type.",
			],
		},
	},
	setup(context) {
		return {
			visitors: {
				VariableDeclaration: (node, { sourceFile }) => {
					if (
						sourceFile.isDeclarationFile ||
						node.initializer !== undefined ||
						node.type !== undefined ||
						node.name.kind !== SyntaxKind.Identifier ||
						node.parent.kind === SyntaxKind.CatchClause ||
						node.parent.flags & ts.NodeFlags.Const ||
						node.parent.parent.kind === SyntaxKind.ForInStatement ||
						node.parent.parent.kind === SyntaxKind.ForOfStatement
					) {
						return;
					}

					context.report({
						data: {
							name: node.name.text,
						},
						message: "implicitAny",
						range: {
							begin: node.name.getStart(sourceFile),
							end: node.name.getEnd(),
						},
					});
				},
			},
		};
	},
});
