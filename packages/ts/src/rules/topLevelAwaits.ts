import {
	isArrowFunction,
	isConstructorDeclaration,
	isFunctionDeclaration,
	isFunctionExpression,
	isGetAccessorDeclaration,
	isMethodDeclaration,
	isSetAccessorDeclaration,
	SyntaxKind,
} from "typescript-native/unstable/ast";

import { typescriptLanguage, type AST } from "@flint.fyi/typescript-language";

import { ruleCreator } from "./ruleCreator.ts";

function hasExportModifier(node: AST.Statement) {
	return !!node.modifiers?.some(
		(modifier) => modifier.kind === SyntaxKind.ExportKeyword,
	);
}

function isInsideFunction(node: AST.AnyNode): boolean {
	let current: AST.AnyNode | undefined = node.parent;

	while (current) {
		if (
			isFunctionDeclaration(current) ||
			isFunctionExpression(current) ||
			isArrowFunction(current) ||
			isMethodDeclaration(current) ||
			isConstructorDeclaration(current) ||
			isGetAccessorDeclaration(current) ||
			isSetAccessorDeclaration(current)
		) {
			return true;
		}
		current = current.parent;
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
