import { type AST, typescriptLanguage } from "@flint.fyi/typescript-language";
import ts, { SyntaxKind } from "typescript";

import { ruleCreator } from "./ruleCreator.ts";

function hasExportModifier(node: AST.Statement) {
	return !!(
		ts.canHaveModifiers(node) &&
		ts
			.getModifiers(node)
			?.some((modifier) => modifier.kind === SyntaxKind.ExportKeyword)
	);
}

function isInsideFunction(node: ts.Node): boolean {
	let current: ts.Node | undefined = node.parent;

	while (current) {
		if (
			ts.isFunctionDeclaration(current) ||
			ts.isFunctionExpression(current) ||
			ts.isArrowFunction(current) ||
			ts.isMethodDeclaration(current) ||
			ts.isConstructorDeclaration(current) ||
			ts.isGetAccessorDeclaration(current) ||
			ts.isSetAccessorDeclaration(current)
		) {
			return true;
		}
		current = current.parent as ts.Node | undefined;
	}

	return false;
}

export default ruleCreator.createRule(typescriptLanguage, {
	about: {
		description:
			"Reports top-level await expressions in files that export values.",
		id: "topLevelAwaits",
		presets: ["logicalStrict"],
	},
	messages: {
		topLevelAwait: {
			primary:
				"Top-level await in a module file causes imports from the module to wait on the asynchronous work.",
			secondary: [
				"Modules using top-level await block their dependents until the await resolves.",
				"This can cause unexpected delays in application startup.",
			],
			suggestions: [
				"Wrap the await in an async function that is called at the appropriate time.",
				"Use dynamic imports with `.then()` for lazy loading.",
			],
		},
	},
	setup(context) {
		let fileHasExports: boolean | undefined;

		return {
			visitors: {
				AwaitExpression(node: AST.AwaitExpression, { sourceFile }) {
					if (!fileHasExports || isInsideFunction(node)) {
						return;
					}

					context.report({
						message: "topLevelAwait",
						range: {
							begin: node.getStart(sourceFile),
							end: node.expression.getStart(sourceFile),
						},
					});
				},
				SourceFile(node) {
					fileHasExports = node.statements.some(
						(statement) =>
							hasExportModifier(statement) ||
							statement.kind === SyntaxKind.ExportAssignment ||
							statement.kind === SyntaxKind.ExportDeclaration,
					);
				},
			},
		};
	},
});
