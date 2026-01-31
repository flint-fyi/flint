import {
	type AST,
	getTSNodeRange,
	typescriptLanguage,
} from "@flint.fyi/typescript-language";
import * as ts from "typescript";
import { z } from "zod";

import { ruleCreator } from "./ruleCreator.ts";

const sizePropertyNames = new Set(["length", "size"]);

function hasLogicalOrFallback(node: AST.Expression) {
	return (
		ts.isBinaryExpression(node.parent) &&
		node.parent.operatorToken.kind === ts.SyntaxKind.BarBarToken &&
		node.parent.left === node
	);
}

function isDoubleNegation(node: AST.Expression) {
	return (
		ts.isPrefixUnaryExpression(node) &&
		node.operator === ts.SyntaxKind.ExclamationToken &&
		ts.isPrefixUnaryExpression(node.operand) &&
		node.operand.operator === ts.SyntaxKind.ExclamationToken
	);
}

function isInBooleanContext(node: AST.Expression) {
	if (isDoubleNegation(node)) {
		return true;
	}

	switch (node.parent.kind) {
		case ts.SyntaxKind.BinaryExpression:
			return (
				node.parent.operatorToken.kind ===
					ts.SyntaxKind.AmpersandAmpersandToken && node.parent.left === node
			);

		case ts.SyntaxKind.CallExpression:
			return (
				ts.isIdentifier(node.parent.expression) &&
				node.parent.expression.text === "Boolean" &&
				node.parent.arguments.length === 1 &&
				node.parent.arguments[0] === node
			);

		case ts.SyntaxKind.ConditionalExpression:
		case ts.SyntaxKind.ForStatement:
			return node.parent.condition === node;

		case ts.SyntaxKind.DoStatement:
		case ts.SyntaxKind.IfStatement:
		case ts.SyntaxKind.WhileStatement:
			return node.parent.expression === node;

		case ts.SyntaxKind.PrefixUnaryExpression:
			return node.parent.operator === ts.SyntaxKind.ExclamationToken;

		default:
			return false;
	}
}

function isInNullishCoalescing(node: AST.Expression) {
	return (
		ts.isBinaryExpression(node.parent) &&
		node.parent.operatorToken.kind === ts.SyntaxKind.QuestionQuestionToken
	);
}

function isNegated(node: AST.PropertyAccessExpression) {
	if (
		!ts.isPrefixUnaryExpression(node.parent) ||
		node.parent.operator !== ts.SyntaxKind.ExclamationToken
	) {
		return { negated: false, outerNode: node };
	}

	if (
		ts.isPrefixUnaryExpression(node.parent.parent) &&
		node.parent.parent.operator === ts.SyntaxKind.ExclamationToken
	) {
		return { negated: false, outerNode: node.parent.parent };
	}

	return { negated: true, outerNode: node.parent };
}

function requiresBooleanType(node: AST.Expression) {
	switch (node.parent.kind) {
		case ts.SyntaxKind.ArrowFunction:
		case ts.SyntaxKind.PropertyDeclaration:
		case ts.SyntaxKind.ReturnStatement:
		case ts.SyntaxKind.VariableDeclaration:
			return true;

		case ts.SyntaxKind.BinaryExpression:
			if (
				node.parent.operatorToken.kind === ts.SyntaxKind.EqualsToken &&
				node.parent.right === node
			) {
				return true;
			}

			if (
				node.parent.operatorToken.kind === ts.SyntaxKind.BarBarToken ||
				node.parent.operatorToken.kind === ts.SyntaxKind.AmpersandAmpersandToken
			) {
				return node.parent.right === node;
			}

			return false;

		case ts.SyntaxKind.ParenthesizedExpression:
			return requiresBooleanType(node.parent.expression);
	}

	return false;
}

export default ruleCreator.createRule(typescriptLanguage, {
	about: {
		description: "Enforce consistent style for `.length` and `.size` checks.",
		id: "sizeComparisonOperators",
		presets: ["stylisticStrict"],
	},
	messages: {
		coercionNonZeroCheck: {
			primary:
				"Prefer implicit boolean coercions instead of explicit `> 0` comparisons.",
			secondary: [
				"Implicit boolean coercion of `.{{ property }}` is more concise.",
			],
			suggestions: ["Replace with `.{{ property }}`."],
		},
		coercionZeroCheck: {
			primary:
				"Prefer implicit boolean coercions instead of explicit `=== 0` comparisons.",
			secondary: [
				"Implicit boolean coercion of `.{{ property }}` is more concise.",
			],
			suggestions: ["Replace with `!.{{ property }}`."],
		},
		explicitNonZeroCheck: {
			primary:
				"Prefer explicit `> 0` comparisons instead of implicit boolean coercions.",
			secondary: [
				"Implicit boolean coercion of `.{{ property }}` can be confusing.",
			],
			suggestions: ["Replace with `.{{ property }} > 0`."],
		},
		explicitZeroCheck: {
			primary:
				"Prefer explicit `=== 0` comparisons instead of implicit boolean coercions.",
			secondary: [
				"Implicit boolean coercion of `.{{ property }}` can be confusing.",
			],
			suggestions: ["Replace with `.{{ property }} === 0`."],
		},
	},
	options: {
		style: z
			.enum(["coercion", "explicit"])
			.default("coercion")
			.describe(
				"Which style to enforce: 'coercion' for implicit boolean checks like `if (arr.length)`, or 'explicit' for comparisons like `if (arr.length > 0)`.",
			),
	},
	setup(context) {
		return {
			visitors: {
				BinaryExpression: (node, { options, sourceFile }) => {
					if (options.style !== "coercion") {
						return;
					}

					const { left, operatorToken, right } = node;

					if (
						!ts.isPropertyAccessExpression(left) ||
						!sizePropertyNames.has(left.name.text) ||
						// TODO: Use a util like getStaticValue
						// https://github.com/flint-fyi/flint/issues/1298
						!ts.isNumericLiteral(right) ||
						right.text !== "0"
					) {
						return;
					}

					const isNonZeroCheck =
						operatorToken.kind === ts.SyntaxKind.GreaterThanToken ||
						operatorToken.kind === ts.SyntaxKind.ExclamationEqualsEqualsToken ||
						operatorToken.kind === ts.SyntaxKind.ExclamationEqualsToken;

					const isZeroCheck =
						operatorToken.kind === ts.SyntaxKind.EqualsEqualsEqualsToken ||
						operatorToken.kind === ts.SyntaxKind.EqualsEqualsToken ||
						operatorToken.kind === ts.SyntaxKind.LessThanEqualsToken;

					if (!isNonZeroCheck && !isZeroCheck) {
						return;
					}

					const propertyText = left.getText(sourceFile);
					const needsBoolean = requiresBooleanType(node);

					if (isZeroCheck) {
						context.report({
							data: { property: left.name.text },
							fix: {
								range: getTSNodeRange(node, sourceFile),
								text: `!${propertyText}`,
							},
							message: "coercionZeroCheck",
							range: getTSNodeRange(node, sourceFile),
						});
					} else {
						context.report({
							data: { property: left.name.text },
							fix: {
								range: getTSNodeRange(node, sourceFile),
								text: needsBoolean ? `!!${propertyText}` : propertyText,
							},
							message: "coercionNonZeroCheck",
							range: getTSNodeRange(node, sourceFile),
						});
					}
				},
				PropertyAccessExpression: (node, { options, sourceFile }) => {
					if (options.style !== "explicit") {
						return;
					}

					if (
						!sizePropertyNames.has(node.name.text) ||
						hasLogicalOrFallback(node) ||
						isInNullishCoalescing(node)
					) {
						return;
					}

					const { negated, outerNode } = isNegated(node);

					if (!isInBooleanContext(outerNode)) {
						return;
					}

					const propertyText = node.getText(sourceFile);

					if (negated) {
						context.report({
							data: { property: node.name.text },
							fix: {
								range: getTSNodeRange(outerNode, sourceFile),
								text: `${propertyText} === 0`,
							},
							message: "explicitZeroCheck",
							range: getTSNodeRange(outerNode, sourceFile),
						});
					} else {
						context.report({
							data: { property: node.name.text },
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
