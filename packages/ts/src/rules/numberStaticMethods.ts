import { SyntaxKind } from "typescript-native/unstable/ast";

import {
	getTSNodeRange,
	isGlobalVariable,
	typescriptLanguage,
	type AST,
} from "@flint.fyi/typescript-language";

import { ruleCreator } from "./ruleCreator.ts";

const globalReplacements = new Map([
	["isFinite", "Number.isFinite"],
	["isNaN", "Number.isNaN"],
]);

function isDeclarationName(node: AST.Identifier) {
	return (
		(node.parent.kind === SyntaxKind.FunctionDeclaration &&
			node.parent.name === node) ||
		(node.parent.kind === SyntaxKind.VariableDeclaration &&
			node.parent.name === node) ||
		(node.parent.kind === SyntaxKind.Parameter && node.parent.name === node)
	);
}

function isLeftHandSide(node: AST.Identifier) {
	return (
		node.parent.kind === SyntaxKind.BinaryExpression &&
		node.parent.left === node &&
		node.parent.operatorToken.kind >= SyntaxKind.FirstAssignment &&
		node.parent.operatorToken.kind <= SyntaxKind.LastAssignment
	);
}

function isPropertyAccessOfNode(node: AST.Identifier) {
	return (
		node.parent.kind === SyntaxKind.PropertyAccessExpression &&
		node.parent.name === node
	);
}

function isPropertyShorthandOfNode(node: AST.Identifier) {
	return (
		node.parent.kind === SyntaxKind.ShorthandPropertyAssignment &&
		node.parent.name === node
	);
}

export default ruleCreator.createRule(typescriptLanguage, {
	about: {
		description:
			"Reports using legacy global functions instead of `Number` static methods.",
		id: "numberStaticMethods",
		presets: ["logicalStrict"],
	},
	messages: {
		preferNumberMethod: {
			primary:
				"Prefer the more precise `{{ replacement }}` over the legacy global `{{ name }}`.",
			secondary: [
				"`Number` static methods clearly indicate you're working with numbers.",
				"The global methods like `isFinite` and `isNaN` coerce their arguments, which can lead to unexpected behavior.",
			],
			suggestions: ["Replace `{{ name }}` with `{{ replacement }}`."],
		},
	},
	setup(context) {
		return {
			visitors: {
				Identifier: (node, { program, sourceFile, typeChecker }) => {
					const replacement = globalReplacements.get(node.text);
					if (
						!replacement ||
						isPropertyAccessOfNode(node) ||
						isPropertyShorthandOfNode(node) ||
						isDeclarationName(node) ||
						!isGlobalVariable(node, typeChecker, program) ||
						isLeftHandSide(node)
					) {
						return;
					}

					const range = getTSNodeRange(node, sourceFile);

					context.report({
						data: { name: node.text, replacement },
						message: "preferNumberMethod",
						range,
						suggestions: [
							{
								id: "replaceWithNumberMethod",
								range,
								text: replacement,
							},
						],
					});
				},
			},
		};
	},
});
