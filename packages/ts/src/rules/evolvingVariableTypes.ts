import ts, { SyntaxKind } from "typescript";

import { typescriptLanguage } from "../language.ts";
import { ruleCreator } from "./ruleCreator.ts";

export default ruleCreator.createRule(typescriptLanguage, {
	about: {
		description:
			"Reports variables declared without type annotation or initializer.",
		id: "evolvingVariableTypes",
		presets: ["logical"],
	},
	messages: {
		implicitAny: {
			primary:
				"Variable '{{ name }}' has an implicit 'any' type due to missing type annotation and initializer.",
			secondary: [
				"Variables declared without a type annotation or initial value implicitly have the 'any' type.",
				"This bypasses TypeScript's type checking and can lead to runtime errors.",
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
					if (sourceFile.isDeclarationFile) {
						return;
					}

					if (node.initializer !== undefined || node.type !== undefined) {
						return;
					}

					if (node.name.kind !== SyntaxKind.Identifier) {
						return;
					}

					const { parent } = node;
					if (parent.kind === SyntaxKind.CatchClause) {
						return;
					}

					if (parent.flags & ts.NodeFlags.Const) {
						return;
					}

					const grandparent = parent.parent;
					if (
						grandparent.kind === SyntaxKind.ForInStatement ||
						grandparent.kind === SyntaxKind.ForOfStatement
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
