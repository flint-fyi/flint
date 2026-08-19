import type ts from "typescript";

import {
	getTSNodeRange,
	typescriptLanguage,
} from "@flint.fyi/typescript-language";
import typescript, {
	SyntaxKind,
} from "@flint.fyi/typescript-language/typescript";

import { ruleCreator } from "./ruleCreator.ts";

function isNonArrowFunctionBoundary(node: ts.Node): "quit" | boolean {
	if (typescript.isArrowFunction(node)) {
		return "quit";
	}
	return (
		typescript.isFunctionDeclaration(node) ||
		typescript.isFunctionExpression(node) ||
		typescript.isMethodDeclaration(node) ||
		typescript.isGetAccessorDeclaration(node) ||
		typescript.isSetAccessorDeclaration(node) ||
		typescript.isConstructorDeclaration(node)
	);
}

export default ruleCreator.createRule(typescriptLanguage, {
	about: {
		description:
			"Reports using the arguments object instead of rest parameters.",
		id: "arguments",
		presets: ["logical", "logicalStrict"],
	},
	messages: {
		preferRestParameters: {
			primary: "Use rest parameters instead of the `arguments` object.",
			secondary: [
				"The `arguments` object is an array-like object that doesn't have Array methods like `map`, `filter`, or `forEach`.",
				"Rest parameters provide a real Array, making it easier to work with variadic functions.",
			],
			suggestions: [
				"Replace usage of `arguments` with a rest parameter like `...args`.",
			],
		},
	},
	setup(context) {
		return {
			visitors: {
				Identifier: (node, { sourceFile, typeChecker }) => {
					if (node.text !== "arguments") {
						return;
					}

					const { parent } = node;

					if (
						(parent.kind === SyntaxKind.PropertyAccessExpression ||
							parent.kind === SyntaxKind.PropertyAssignment ||
							parent.kind === SyntaxKind.ShorthandPropertyAssignment ||
							parent.kind === SyntaxKind.Parameter ||
							parent.kind === SyntaxKind.VariableDeclaration ||
							parent.kind === SyntaxKind.PropertyDeclaration ||
							parent.kind === SyntaxKind.BindingElement ||
							parent.kind === SyntaxKind.PropertySignature) &&
						parent.name === node
					) {
						return;
					}

					// TODO: This might get simpler when we have scope analysis.
					// https://github.com/JoshuaKGoldberg/flint/issues/400
					if (!typescript.findAncestor(node, isNonArrowFunctionBoundary)) {
						return;
					}

					const symbol = typeChecker.getSymbolAtLocation(node);

					if (
						!symbol ||
						symbol
							.getDeclarations()
							?.some(
								(declaration) =>
									typescript.isParameter(declaration) ||
									typescript.isVariableDeclaration(declaration) ||
									typescript.isPropertyDeclaration(declaration) ||
									typescript.isBindingElement(declaration),
							)
					) {
						return;
					}

					context.report({
						message: "preferRestParameters",
						range: getTSNodeRange(node, sourceFile),
					});
				},
			},
		};
	},
});
