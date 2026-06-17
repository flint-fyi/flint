import ts, { SyntaxKind } from "typescript";

import {
	getModifyingReferences,
	typescriptLanguage,
} from "@flint.fyi/typescript-language";

import { ruleCreator } from "./ruleCreator.ts";

export default ruleCreator.createRule(typescriptLanguage, {
	about: {
		description:
			"Reports variables that are declared but never assigned a value.",
		id: "unassignedVariables",
		presets: ["javascript"],
	},
	messages: {
		noUnassigned: {
			primary: "Variable '{{ name }}' is declared but never assigned a value.",
			secondary: [
				"Declaring a variable without ever assigning it a value means it will always be `undefined`.",
				"This is often a mistake, such as forgetting to initialize the variable or assign to it later.",
			],
			suggestions: [
				"Assign a value to the variable, either at declaration or before it is used.",
				"If the variable is meant to be `undefined`, consider making that explicit for clarity.",
			],
		},
	},
	setup(context) {
		return {
			visitors: {
				VariableDeclaration: (node, { sourceFile }) => {
					if (node.initializer || node.name.kind !== SyntaxKind.Identifier) {
						return;
					}

					if (
						node.parent.kind === SyntaxKind.VariableDeclarationList &&
						!!(node.parent.flags & ts.NodeFlags.Const)
					) {
						return;
					}

					if (!getModifyingReferences(node.name, sourceFile).length) {
						context.report({
							data: {
								name: node.name.text,
							},
							message: "noUnassigned",
							range: {
								begin: node.name.getStart(sourceFile),
								end: node.name.getEnd(),
							},
						});
					}
				},
			},
		};
	},
});
