import { SyntaxKind, type Node } from "typescript-native/unstable/ast";

import {
	getTSNodeRange,
	typescriptLanguage,
} from "@flint.fyi/typescript-language";

import { ruleCreator } from "./ruleCreator.ts";

function isNonArrowFunctionBoundary(node: Node): "quit" | boolean {
	if (node.kind === SyntaxKind.ArrowFunction) {
		return "quit";
	}
	return (
		node.kind === SyntaxKind.FunctionDeclaration ||
		node.kind === SyntaxKind.FunctionExpression ||
		node.kind === SyntaxKind.MethodDeclaration ||
		node.kind === SyntaxKind.GetAccessor ||
		node.kind === SyntaxKind.SetAccessor ||
		node.kind === SyntaxKind.Constructor
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

					const symbol = typeChecker.getSymbolAtLocation(node);

					if (
						!symbol ||
						symbol.declarations.some(
							(declarationHandle: (typeof symbol.declarations)[number]) => {
								const declaration = declarationHandle.resolve();
								return (
									!!declaration &&
									(declaration.kind === SyntaxKind.Parameter ||
										declaration.kind === SyntaxKind.VariableDeclaration ||
										declaration.kind === SyntaxKind.PropertyDeclaration ||
										declaration.kind === SyntaxKind.BindingElement)
								);
							},
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
