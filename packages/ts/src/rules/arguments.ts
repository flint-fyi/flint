import {
	isArrowFunction,
	isBindingElement,
	isConstructorDeclaration,
	isFunctionDeclaration,
	isFunctionExpression,
	isGetAccessorDeclaration,
	isMethodDeclaration,
	isParameterDeclaration,
	isPropertyDeclaration,
	isSetAccessorDeclaration,
	isVariableDeclaration,
	SyntaxKind,
	type Node,
} from "typescript-native/unstable/ast";

import {
	getTSNodeRange,
	typescriptLanguage,
} from "@flint.fyi/typescript-language";

import { ruleCreator } from "./ruleCreator.ts";

function isNonArrowFunctionBoundary(node: Node): "quit" | boolean {
	if (isArrowFunction(node)) {
		return "quit";
	}
	return (
		isFunctionDeclaration(node) ||
		isFunctionExpression(node) ||
		isMethodDeclaration(node) ||
		isGetAccessorDeclaration(node) ||
		isSetAccessorDeclaration(node) ||
		isConstructorDeclaration(node)
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
				Identifier: (node, { checker, sourceFile }) => {
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
					let current = node.parent;
					let boundary: "quit" | boolean;
					while (!(boundary = isNonArrowFunctionBoundary(current))) {
						if (current.kind === SyntaxKind.SourceFile) {
							return;
						}
						current = current.parent;
					}
					if (boundary === "quit") {
						return;
					}

					const symbol = checker.getSymbolAtLocation(node);

					if (
						!symbol ||
						symbol.declarations.some((declarationHandle) => {
							const declaration = declarationHandle.resolve();
							return (
								!!declaration &&
								(isParameterDeclaration(declaration) ||
									isVariableDeclaration(declaration) ||
									isPropertyDeclaration(declaration) ||
									isBindingElement(declaration))
							);
						})
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
