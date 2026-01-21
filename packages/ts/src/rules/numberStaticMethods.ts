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
	["NaN", "Number.NaN"],
	["parseFloat", "Number.parseFloat"],
	["parseInt", "Number.parseInt"],
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
			"Reports using global number methods and properties instead of Number static methods.",
		id: "numberStaticMethods",
		presets: ["stylisticStrict"],
	},
	messages: {
		preferNumberMethod: {
			primary:
				"Prefer `{{ replacement }}` over the global `{{ name }}` for clarity and consistency.",
			secondary: [
				"`Number` static methods clearly indicate you're working with numbers.",
				"Global methods like `isNaN` and `isFinite` coerce their arguments, which can lead to unexpected behavior.",
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

					context.report({
						data: { name: node.text, replacement },
						message: "preferNumberMethod",
						range: getTSNodeRange(node, sourceFile),
					});
				},
			},
		};
	},
});
