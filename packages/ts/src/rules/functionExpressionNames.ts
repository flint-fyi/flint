import ts from "typescript";

import { getTSNodeRange } from "../getTSNodeRange.ts";
import type { AST } from "../index.ts";
import { typescriptLanguage } from "../language.ts";
import { ruleCreator } from "./ruleCreator.ts";

function hasInferredName(node: AST.FunctionExpression): boolean {
	switch (node.parent.kind) {
		case ts.SyntaxKind.BinaryExpression:
			return (
				node.parent.operatorToken.kind === ts.SyntaxKind.EqualsToken &&
				node.parent.left.kind === ts.SyntaxKind.Identifier
			);

		case ts.SyntaxKind.PropertyAssignment:
		case ts.SyntaxKind.PropertyDeclaration:
		case ts.SyntaxKind.VariableDeclaration:
			return node.parent.name.kind === ts.SyntaxKind.Identifier;

		default:
			return false;
	}
}

export default ruleCreator.createRule(typescriptLanguage, {
	about: {
		description: "Reports function expressions without names.",
		id: "functionExpressionNames",
		presets: ["stylistic"],
	},
	messages: {
		missingName: {
			primary: "Function expressions without names are harder to debug.",
			secondary: [
				"Named function expressions produce better stack traces for debugging.",
				"The function name appears in error messages and developer tools.",
			],
			suggestions: [
				"Give the function a name.",
				"Initialize the function in a named property or variable.",
			],
		},
	},
	setup(context) {
		return {
			visitors: {
				FunctionExpression: (node, { sourceFile }) => {
					if (!!node.name || hasInferredName(node)) {
						return;
					}

					// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
					const functionKeyword = node
						.getChildren(sourceFile)
						.find((child) => child.kind === ts.SyntaxKind.FunctionKeyword)!;

					context.report({
						message: "missingName",
						range: getTSNodeRange(functionKeyword, sourceFile),
					});
				},
			},
		};
	},
});
