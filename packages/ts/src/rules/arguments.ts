import * as ts from "typescript";

import {
	getTSNodeRange,
	typescriptLanguage,
} from "@flint.fyi/typescript-language";

import { ruleCreator } from "./ruleCreator.ts";

function isNonArrowFunctionBoundary(node: ts.Node): "quit" | boolean {
	if (ts.isArrowFunction(node)) {
		return "quit";
	}
	return (
		ts.isFunctionDeclaration(node) ||
		ts.isFunctionExpression(node) ||
		ts.isMethodDeclaration(node) ||
		ts.isGetAccessorDeclaration(node) ||
		ts.isSetAccessorDeclaration(node) ||
		ts.isConstructorDeclaration(node)
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
						(parent.kind === ts.SyntaxKind.PropertyAccessExpression ||
							parent.kind === ts.SyntaxKind.PropertyAssignment ||
							parent.kind === ts.SyntaxKind.ShorthandPropertyAssignment ||
							parent.kind === ts.SyntaxKind.Parameter ||
							parent.kind === ts.SyntaxKind.VariableDeclaration ||
							parent.kind === ts.SyntaxKind.PropertyDeclaration ||
							parent.kind === ts.SyntaxKind.BindingElement ||
							parent.kind === ts.SyntaxKind.PropertySignature) &&
						parent.name === node
					) {
						return;
					}

					// TODO: This might get simpler when we have scope analysis.
					// https://github.com/JoshuaKGoldberg/flint/issues/400
					if (!ts.findAncestor(node, isNonArrowFunctionBoundary)) {
						return;
					}

					const symbol = typeChecker.getSymbolAtLocation(node);

					if (
						!symbol ||
						symbol
							.getDeclarations()
							?.some(
								(declaration) =>
									ts.isParameter(declaration) ||
									ts.isVariableDeclaration(declaration) ||
									ts.isPropertyDeclaration(declaration) ||
									ts.isBindingElement(declaration),
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
