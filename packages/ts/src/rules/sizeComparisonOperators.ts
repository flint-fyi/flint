import { z } from "zod/v4";

import {
	getStaticNumberValue,
	getTSNodeRange,
	typescriptLanguage,
	type AST,
} from "@flint.fyi/typescript-language";
import { SyntaxKind } from "@flint.fyi/typescript-language/typescript";

import { ruleCreator } from "./ruleCreator.ts";

const sizePropertyNames = new Set(["length", "size"]);

function hasLogicalOrFallback(node: AST.Expression) {
	return (
		node.parent.kind === SyntaxKind.BinaryExpression &&
		node.parent.operatorToken.kind === SyntaxKind.BarBarToken &&
		node.parent.left === node
	);
}

function isDoubleNegation(node: AST.Expression) {
	return (
		node.kind === SyntaxKind.PrefixUnaryExpression &&
		node.operator === SyntaxKind.ExclamationToken &&
		node.operand.kind === SyntaxKind.PrefixUnaryExpression &&
		node.operand.operator === SyntaxKind.ExclamationToken
	);
}

function isInBooleanContext(node: AST.Expression) {
	if (isDoubleNegation(node)) {
		return true;
	}

	switch (node.parent.kind) {
		case SyntaxKind.BinaryExpression:
			return (
				node.parent.operatorToken.kind === SyntaxKind.AmpersandAmpersandToken &&
				node.parent.left === node
			);

		case SyntaxKind.CallExpression:
			return (
				node.parent.expression.kind === SyntaxKind.Identifier &&
				node.parent.expression.text === "Boolean" &&
				node.parent.arguments.length === 1 &&
				node.parent.arguments[0] === node
			);

		case SyntaxKind.ConditionalExpression:
		case SyntaxKind.ForStatement:
			return node.parent.condition === node;

		case SyntaxKind.DoStatement:
		case SyntaxKind.IfStatement:
		case SyntaxKind.WhileStatement:
			return node.parent.expression === node;

		case SyntaxKind.PrefixUnaryExpression:
			return node.parent.operator === SyntaxKind.ExclamationToken;

		default:
			return false;
	}
}

function isInNullishCoalescing(node: AST.Expression) {
	return (
		node.parent.kind === SyntaxKind.BinaryExpression &&
		node.parent.operatorToken.kind === SyntaxKind.QuestionQuestionToken
	);
}

function isNegated(node: AST.PropertyAccessExpression) {
	if (
		node.parent.kind !== SyntaxKind.PrefixUnaryExpression ||
		node.parent.operator !== SyntaxKind.ExclamationToken
	) {
		return { negated: false, outerNode: node };
	}

	if (
		node.parent.parent.kind === SyntaxKind.PrefixUnaryExpression &&
		node.parent.parent.operator === SyntaxKind.ExclamationToken
	) {
		return { negated: false, outerNode: node.parent.parent };
	}

	return { negated: true, outerNode: node.parent };
}

function requiresBooleanType(node: AST.Expression) {
	switch (node.parent.kind) {
		case SyntaxKind.ArrowFunction:
		case SyntaxKind.PropertyDeclaration:
		case SyntaxKind.ReturnStatement:
		case SyntaxKind.VariableDeclaration:
			return true;

		case SyntaxKind.BinaryExpression:
			if (
				node.parent.operatorToken.kind === SyntaxKind.EqualsToken &&
				node.parent.right === node
			) {
				return true;
			}

			if (
				node.parent.operatorToken.kind === SyntaxKind.BarBarToken ||
				node.parent.operatorToken.kind === SyntaxKind.AmpersandAmpersandToken
			) {
				return node.parent.right === node;
			}

			return false;

		case SyntaxKind.ParenthesizedExpression:
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
						left.kind !== SyntaxKind.PropertyAccessExpression ||
						!sizePropertyNames.has(left.name.text) ||
						!Object.is(getStaticNumberValue(right), 0)
					) {
						return;
					}

					const isNonZeroCheck =
						operatorToken.kind === SyntaxKind.GreaterThanToken ||
						operatorToken.kind === SyntaxKind.ExclamationEqualsEqualsToken ||
						operatorToken.kind === SyntaxKind.ExclamationEqualsToken;

					const isZeroCheck =
						operatorToken.kind === SyntaxKind.EqualsEqualsEqualsToken ||
						operatorToken.kind === SyntaxKind.EqualsEqualsToken ||
						operatorToken.kind === SyntaxKind.LessThanEqualsToken;

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
