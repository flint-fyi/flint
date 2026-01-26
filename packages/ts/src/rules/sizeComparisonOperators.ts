import {
	type AST,
	getTSNodeRange,
	typescriptLanguage,
} from "@flint.fyi/typescript-language";
import * as ts from "typescript";

import { ruleCreator } from "./ruleCreator.ts";

const sizePropertyNames = new Set(["length", "size"]);

function hasLogicalOrFallback(node: AST.Expression): boolean {
	const parent = node.parent;

	if (
		ts.isBinaryExpression(parent) &&
		parent.operatorToken.kind === ts.SyntaxKind.BarBarToken &&
		parent.left === node
	) {
		return true;
	}

	return false;
}

function isDoubleNegation(node: AST.Expression): boolean {
	return (
		ts.isPrefixUnaryExpression(node) &&
		node.operator === ts.SyntaxKind.ExclamationToken &&
		ts.isPrefixUnaryExpression(node.operand) &&
		node.operand.operator === ts.SyntaxKind.ExclamationToken
	);
}

function isInBooleanContext(node: AST.Expression): boolean {
	if (isDoubleNegation(node)) {
		return true;
	}

	const parent = node.parent;

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

	if (
		ts.isBinaryExpression(parent) &&
		parent.operatorToken.kind === ts.SyntaxKind.AmpersandAmpersandToken &&
		parent.left === node
	) {
		return true;
	}

	if (ts.isCallExpression(parent)) {
		if (
			ts.isIdentifier(parent.expression) &&
			parent.expression.text === "Boolean" &&
			parent.arguments.length === 1 &&
			parent.arguments[0] === node
		) {
			return true;
		}
	}

	return false;
}

function isInNullishCoalescing(node: AST.Expression): boolean {
	const parent = node.parent;

	if (
		ts.isBinaryExpression(parent) &&
		parent.operatorToken.kind === ts.SyntaxKind.QuestionQuestionToken
	) {
		return true;
	}

	return false;
}

function isNegated(node: AST.PropertyAccessExpression): {
	isNegated: boolean;
	outerNode: AST.Expression;
} {
	const parent = node.parent;

	if (
		ts.isPrefixUnaryExpression(parent) &&
		parent.operator === ts.SyntaxKind.ExclamationToken
	) {
		const grandparent = parent.parent;
		if (
			ts.isPrefixUnaryExpression(grandparent) &&
			grandparent.operator === ts.SyntaxKind.ExclamationToken
		) {
			return { isNegated: false, outerNode: grandparent };
		}
		return { isNegated: true, outerNode: parent };
	}

	return { isNegated: false, outerNode: node };
}

export default ruleCreator.createRule(typescriptLanguage, {
	about: {
		description:
			"Prefer explicit comparison operators for `.length` and `.size` checks.",
		id: "sizeComparisonOperators",
		presets: ["stylisticStrict"],
	},
	messages: {
		explicitNonZeroCheck: {
			primary:
				"Use explicit `> 0` comparison instead of implicit boolean coercion.",
			secondary: [
				"Implicit boolean coercion of `.{{ property }}` can be confusing.",
			],
			suggestions: ["Replace with `.{{ property }} > 0`."],
		},
		explicitZeroCheck: {
			primary:
				"Use explicit `=== 0` comparison instead of implicit boolean coercion.",
			secondary: [
				"Implicit boolean coercion of `.{{ property }}` can be confusing.",
			],
			suggestions: ["Replace with `.{{ property }} === 0`."],
		},
	},
	setup(context) {
		return {
			visitors: {
				PropertyAccessExpression: (node, { sourceFile }) => {
					if (!sizePropertyNames.has(node.name.text)) {
						return;
					}

					if (hasLogicalOrFallback(node) || isInNullishCoalescing(node)) {
						return;
					}

					const { isNegated: negated, outerNode } = isNegated(node);

					if (!isInBooleanContext(outerNode)) {
						return;
					}

					const propertyName = node.name.text;
					const propertyText = node.getText(sourceFile);

					if (negated) {
						context.report({
							data: { property: propertyName },
							fix: {
								range: getTSNodeRange(outerNode, sourceFile),
								text: `${propertyText} === 0`,
							},
							message: "explicitZeroCheck",
							range: getTSNodeRange(outerNode, sourceFile),
						});
					} else {
						context.report({
							data: { property: propertyName },
							fix: {
								range: getTSNodeRange(outerNode, sourceFile),
								text: `${propertyText} > 0`,
							},
							message: "explicitNonZeroCheck",
							range: getTSNodeRange(outerNode, sourceFile),
						});
					}
				},
			},
		};
	},
});
