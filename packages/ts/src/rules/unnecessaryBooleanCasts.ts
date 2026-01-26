import { type AST, typescriptLanguage } from "@flint.fyi/typescript-language";
import ts from "typescript";

import { ruleCreator } from "./ruleCreator.ts";

function isInBooleanContext(node: ts.Node): boolean {
	const parent = node.parent;
	if (!parent) {
		return false;
	}

	if (ts.isIfStatement(parent) && parent.expression === node) {
		return true;
	}

	if (ts.isWhileStatement(parent) && parent.expression === node) {
		return true;
	}

	if (ts.isDoStatement(parent) && parent.expression === node) {
		return true;
	}

	if (ts.isForStatement(parent) && parent.condition === node) {
		return true;
	}

	if (ts.isConditionalExpression(parent) && parent.condition === node) {
		return true;
	}

	if (
		ts.isPrefixUnaryExpression(parent) &&
		parent.operator === ts.SyntaxKind.ExclamationToken
	) {
		return true;
	}

	return false;
}

function isDoubleNegation(node: ts.PrefixUnaryExpression): boolean {
	if (node.operator !== ts.SyntaxKind.ExclamationToken) {
		return false;
	}

	const operand = node.operand;
	if (
		ts.isPrefixUnaryExpression(operand) &&
		operand.operator === ts.SyntaxKind.ExclamationToken
	) {
		return true;
	}

	return false;
}

function isBooleanCall(node: ts.CallExpression): boolean {
	return ts.isIdentifier(node.expression) && node.expression.text === "Boolean";
}

export default ruleCreator.createRule(typescriptLanguage, {
	about: {
		description: "Reports unnecessary boolean casts.",
		id: "unnecessaryBooleanCasts",
		presets: ["logical"],
	},
	messages: {
		doubleNegation: {
			primary: "Redundant double negation.",
			secondary: ["The value is already in a boolean context."],
			suggestions: ["Remove the double negation."],
		},
		booleanCall: {
			primary: "Redundant Boolean() call.",
			secondary: ["The value is already in a boolean context."],
			suggestions: ["Remove the Boolean() call."],
		},
	},
	setup(context) {
		return {
			visitors: {
				PrefixUnaryExpression(node: AST.PrefixUnaryExpression, { sourceFile }) {
					if (isDoubleNegation(node) && isInBooleanContext(node)) {
						context.report({
							message: "doubleNegation",
							range: {
								begin: node.getStart(sourceFile),
								end: node.getEnd(),
							},
						});
					}
				},
				CallExpression(node: AST.CallExpression, { sourceFile }) {
					if (isBooleanCall(node) && isInBooleanContext(node)) {
						context.report({
							message: "booleanCall",
							range: {
								begin: node.getStart(sourceFile),
								end: node.getEnd(),
							},
						});
					}
				},
			},
		};
	},
});
