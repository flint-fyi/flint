import {
	type AST,
	type Checker,
	getTSNodeRange,
	typescriptLanguage,
} from "@flint.fyi/ts";
import ts, { SyntaxKind } from "typescript";

function isLocalExportsVariable(
	node: AST.Identifier,
	sourceFile: ts.SourceFile,
	typeChecker: Checker,
) {
	return typeChecker
		.getSymbolAtLocation(node)
		?.getDeclarations()
		?.some((declaration) => declaration.getSourceFile() === sourceFile);
}

function isModuleExportsAccess(node: AST.Expression) {
	return (
		node.kind == SyntaxKind.PropertyAccessExpression &&
		node.expression.kind == SyntaxKind.Identifier &&
		node.expression.text === "module" &&
		node.name.kind == SyntaxKind.Identifier &&
		node.name.text === "exports"
	);
}

function isModuleExportsAccessAssignment(
	node: AST.Expression | AST.ExpressionParent,
) {
	return (
		node.kind == SyntaxKind.BinaryExpression &&
		node.operatorToken.kind === SyntaxKind.EqualsToken &&
		isModuleExportsAccess(node.left)
	);
}

export default typescriptLanguage.createRule({
	about: {
		description:
			"Prevent assignment to the `exports` variable in CommonJS modules.",
		id: "exportsAssignments",
		preset: "logical",
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
				BinaryExpression: (node, { sourceFile, typeChecker }) => {
					if (
						node.operatorToken.kind == SyntaxKind.EqualsToken &&
						node.left.kind == SyntaxKind.Identifier &&
						node.left.text === "exports" &&
						!isLocalExportsVariable(node.left, sourceFile, typeChecker) &&
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
