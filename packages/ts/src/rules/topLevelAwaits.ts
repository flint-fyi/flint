import type ts from "typescript";

import { typescriptLanguage, type AST } from "@flint.fyi/typescript-language";
import typescript, {
	SyntaxKind,
} from "@flint.fyi/typescript-language/typescript";

import { ruleCreator } from "./ruleCreator.ts";

function hasExportModifier(node: AST.Statement) {
	return !!(
		typescript.canHaveModifiers(node) &&
		typescript
			.getModifiers(node)
			?.some((modifier) => modifier.kind === SyntaxKind.ExportKeyword)
	);
}

function isInsideFunction(node: ts.Node): boolean {
	let current: ts.Node | undefined = node.parent;

	while (current) {
		if (
			typescript.isFunctionDeclaration(current) ||
			typescript.isFunctionExpression(current) ||
			typescript.isArrowFunction(current) ||
			typescript.isMethodDeclaration(current) ||
			typescript.isConstructorDeclaration(current) ||
			typescript.isGetAccessorDeclaration(current) ||
			typescript.isSetAccessorDeclaration(current)
		) {
			return true;
		} // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion -- removing causes type error on the `while` loop. TSESLint bug?
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
