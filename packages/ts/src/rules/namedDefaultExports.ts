import {
	type AST,
	getTSNodeRange,
	typescriptLanguage,
} from "@flint.fyi/typescript-language";
import ts, { SyntaxKind } from "typescript";

import { ruleCreator } from "./ruleCreator.ts";

function hasDefaultModifier(
	modifiers: ts.NodeArray<AST.ModifierLike> | undefined,
) {
	return modifiers?.some((mod) => mod.kind === SyntaxKind.DefaultKeyword);
}

function hasExportModifier(
	modifiers: ts.NodeArray<AST.ModifierLike> | undefined,
) {
	return modifiers?.some((mod) => mod.kind === SyntaxKind.ExportKeyword);
}

export default ruleCreator.createRule(typescriptLanguage, {
	about: {
		description:
			"Reports anonymous functions and classes as the default export.",
		id: "namedDefaultExports",
		presets: ["stylisticStrict"],
	},
	messages: {
		anonymousClass: {
			primary: "This default-exported class is missing an informative name.",
			secondary: [
				"Named default exports improve codebase searchability by ensuring consistent identifier use for a module's default export.",
				"When a class is anonymous, it becomes harder to find all usages and references in the codebase.",
			],
			suggestions: ["Add a name to the exported class."],
		},
		anonymousFunction: {
			primary: "This default-exported function is missing an informative name.",
			secondary: [
				"Named default exports improve codebase searchability by ensuring consistent identifier use for a module's default export.",
				"When a function is anonymous, it becomes harder to find all usages and references in the codebase.",
			],
			suggestions: [
				"Add a name to the exported function.",
				"Assign the arrow function to a named variable, then export it.",
			],
		},
	},
	setup(context) {
		return {
			visitors: {
				ClassDeclaration: (node, { sourceFile }) => {
					if (
						hasExportModifier(node.modifiers) &&
						hasDefaultModifier(node.modifiers) &&
						!node.name
					) {
						context.report({
							message: "anonymousClass",
							range: getTSNodeRange(node, sourceFile),
						});
					}
				},
				ExportAssignment: (node, { sourceFile }) => {
					if (node.isExportEquals) {
						return;
					}

					if (
						ts.isArrowFunction(node.expression) ||
						(ts.isFunctionExpression(node.expression) && !node.expression.name)
					) {
						context.report({
							message: "anonymousFunction",
							range: getTSNodeRange(node.expression, sourceFile),
						});
					} else if (
						ts.isClassExpression(node.expression) &&
						!node.expression.name
					) {
						context.report({
							message: "anonymousClass",
							range: getTSNodeRange(node.expression, sourceFile),
						});
					}
				},
				FunctionDeclaration: (node, { sourceFile }) => {
					if (
						hasExportModifier(node.modifiers) &&
						hasDefaultModifier(node.modifiers) &&
						!node.name
					) {
						context.report({
							message: "anonymousFunction",
							range: getTSNodeRange(node, sourceFile),
						});
					}
				},
			},
		};
	},
});
