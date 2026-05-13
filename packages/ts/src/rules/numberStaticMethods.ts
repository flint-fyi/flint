import {
	type AST,
	getTSNodeRange,
	isGlobalVariable,
	typescriptLanguage,
} from "@flint.fyi/typescript-language";
import ts from "typescript";

import { ruleCreator } from "./ruleCreator.ts";

const globalReplacements = new Map([
	["isFinite", "Number.isFinite"],
	["isNaN", "Number.isNaN"],
]);

function isDeclarationName(node: ts.Identifier) {
	return (
		(ts.isFunctionDeclaration(node.parent) && node.parent.name === node) ||
		(ts.isVariableDeclaration(node.parent) && node.parent.name === node) ||
		(ts.isParameter(node.parent) && node.parent.name === node)
	);
}

function isLeftHandSide(node: AST.Identifier) {
	return (
		node.parent.kind === ts.SyntaxKind.BinaryExpression &&
		ts.isBinaryExpression(node.parent) &&
		node.parent.left === node &&
		node.parent.operatorToken.kind >= ts.SyntaxKind.FirstAssignment &&
		node.parent.operatorToken.kind <= ts.SyntaxKind.LastAssignment
	);
}

function isPropertyAccessOfNode(node: ts.Identifier) {
	return (
		ts.isPropertyAccessExpression(node.parent) && node.parent.name === node
	);
}

function isPropertyShorthandOfNode(node: ts.Identifier) {
	return (
		ts.isShorthandPropertyAssignment(node.parent) && node.parent.name === node
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
				Identifier: (node, { sourceFile, typeChecker }) => {
					const replacement = globalReplacements.get(node.text);
					if (
						!replacement ||
						isPropertyAccessOfNode(node) ||
						isPropertyShorthandOfNode(node) ||
						isDeclarationName(node) ||
						!isGlobalVariable(node, typeChecker) ||
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
