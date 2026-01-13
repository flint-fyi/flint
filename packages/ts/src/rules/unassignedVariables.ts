import ts, { SyntaxKind } from "typescript";

import { typescriptLanguage } from "../language.ts";
import * as AST from "../types/ast.ts";
import type { Checker } from "../types/checker.ts";
import { getModifyingReferences } from "../utils/getModifyingReferences.ts";

export default typescriptLanguage.createRule({
	about: {
		description:
			"Reports variables that are declared but never assigned a value.",
		id: "unassignedVariables",
		preset: "untyped",
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
		function hasAssignments(
			identifier: AST.Identifier,
			sourceFile: ts.SourceFile,
			typeChecker: Checker,
		): boolean {
			// TODO (#400): Switch to scope analysis
			return !!getModifyingReferences(identifier, sourceFile, typeChecker)
				.length;
		}

		return {
			visitors: {
				VariableDeclaration: (node, { sourceFile, typeChecker }) => {
					if (node.initializer || node.name.kind !== SyntaxKind.Identifier) {
						return;
					}

					if (
						node.parent.kind === SyntaxKind.VariableDeclarationList &&
						!!(node.parent.flags & ts.NodeFlags.Const)
					) {
						return;
					}

					if (!hasAssignments(node.name, sourceFile, typeChecker)) {
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
