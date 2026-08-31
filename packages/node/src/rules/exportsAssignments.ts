import { SyntaxKind } from "typescript-native/unstable/ast";

import {
	getTSNodeRange,
	typescriptLanguage,
	type AST,
	type Checker,
} from "@flint.fyi/typescript-language";

import { ruleCreator } from "./ruleCreator.ts";

function isLocalExportsVariable(
	node: AST.Identifier,
	sourceFile: AST.SourceFile,
	checker: Checker,
) {
	return checker
		.getSymbolAtLocation(node)
		?.declarations.some(
			(declaration) => declaration.resolve()?.getSourceFile() === sourceFile,
		);
}

function isModuleExportsAccess(node: AST.Expression) {
	return (
		node.kind === SyntaxKind.PropertyAccessExpression &&
		node.expression.kind === SyntaxKind.Identifier &&
		node.expression.text === "module" &&
		node.name.kind === SyntaxKind.Identifier &&
		node.name.text === "exports"
	);
}

function isModuleExportsAccessAssignment(
	node: AST.Expression | AST.ExpressionParent,
) {
	return (
		node.kind === SyntaxKind.BinaryExpression &&
		node.operatorToken.kind === SyntaxKind.EqualsToken &&
		isModuleExportsAccess(node.left)
	);
}

export default ruleCreator.createRule(typescriptLanguage, {
	about: {
		description:
			"Prevent assignment to the `exports` variable in CommonJS modules.",
		id: "exportsAssignments",
		presets: ["logical"],
	},
	messages: {
		noExportsAssign: {
			primary:
				"Assigning to `exports` rather than `module.exports` may break references to `module.exports`.",
			secondary: [
				"Assigning to `exports` directly breaks the reference to `module.exports`.",
				"Use `module.exports` to ensure your exports work as expected.",
			],
			suggestions: ["Use `module.exports` instead of `exports`"],
		},
	},
	setup(context) {
		return {
			visitors: {
				BinaryExpression: (node, { checker, sourceFile }) => {
					if (
						node.operatorToken.kind === SyntaxKind.EqualsToken &&
						node.left.kind === SyntaxKind.Identifier &&
						node.left.text === "exports" &&
						!isLocalExportsVariable(node.left, sourceFile, checker) &&
						!isModuleExportsAccessAssignment(node.right) &&
						!isModuleExportsAccessAssignment(node.parent)
					) {
						context.report({
							message: "noExportsAssign",
							range: getTSNodeRange(node.left, sourceFile),
						});
					}
				},
			},
		};
	},
});
