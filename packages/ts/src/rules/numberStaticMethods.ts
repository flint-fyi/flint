import {
	type AST,
	getTSNodeRange,
	isGlobalVariable,
	typescriptLanguage,
} from "@flint.fyi/typescript-language";
import ts from "typescript";

import { ruleCreator } from "./ruleCreator.ts";

const globalProperties = new Map([
	["Infinity", "Number.POSITIVE_INFINITY"],
	["isFinite", "Number.isFinite"],
	["isNaN", "Number.isNaN"],
	["NaN", "Number.NaN"],
	["parseFloat", "Number.parseFloat"],
	["parseInt", "Number.parseInt"],
]);

function isDeclarationName(node: ts.Identifier) {
	const { parent } = node;
	return (
		(ts.isFunctionDeclaration(parent) && parent.name === node) ||
		(ts.isVariableDeclaration(parent) && parent.name === node) ||
		(ts.isParameter(parent) && parent.name === node)
	);
}

function isLeftHandSide(node: AST.Identifier) {
	if (
		node.parent.kind === ts.SyntaxKind.BinaryExpression &&
		ts.isBinaryExpression(node.parent) &&
		node.parent.left === node
	) {
		const { operatorToken } = node.parent;
		return (
			operatorToken.kind >= ts.SyntaxKind.FirstAssignment &&
			operatorToken.kind <= ts.SyntaxKind.LastAssignment
		);
	}

	return false;
}

function isNegativeInfinity(node: AST.Identifier) {
	return (
		node.parent.kind === ts.SyntaxKind.PrefixUnaryExpression &&
		ts.isPrefixUnaryExpression(node.parent) &&
		node.parent.operator === ts.SyntaxKind.MinusToken &&
		node.parent.operand === node
	);
}

function isPropertyAccess(node: ts.Identifier) {
	return (
		ts.isPropertyAccessExpression(node.parent) && node.parent.name === node
	);
}

function isPropertyShorthand(node: ts.Identifier) {
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
					const replacement = globalProperties.get(node.text);
					if (!replacement) {
						return;
					}

					if (
						isPropertyAccess(node) ||
						isPropertyShorthand(node) ||
						isDeclarationName(node)
					) {
						return;
					}

					if (!isGlobalVariable(node, typeChecker)) {
						return;
					}

					if (isLeftHandSide(node)) {
						return;
					}

					let finalReplacement = replacement;
					let reportNode: AST.AnyNode = node;

					if (node.text === "Infinity" && isNegativeInfinity(node)) {
						finalReplacement = "Number.NEGATIVE_INFINITY";
						reportNode = node.parent;
					}

					context.report({
						data: { name: node.text, replacement: finalReplacement },
						message: "preferNumberMethod",
						range: getTSNodeRange(reportNode, sourceFile),
					});
				},
			},
		};
	},
});
