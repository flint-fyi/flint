import { SyntaxKind } from "typescript";

import { getTSNodeRange } from "../getTSNodeRange.ts";
import { typescriptLanguage } from "../language.ts";
import * as AST from "../types/ast.ts";

function getConditionDirection(
	condition: AST.Expression,
	counterName: string,
): -1 | 1 | undefined {
	if (condition.kind !== SyntaxKind.BinaryExpression) {
		return undefined;
	}

	const leftName = getCounterName(condition.left);
	const rightName = getCounterName(condition.right);

	if (!leftName && !rightName) {
		return condition.operatorToken.kind === SyntaxKind.AmpersandAmpersandToken
			? (getConditionDirection(condition.left, counterName) ??
					getConditionDirection(condition.right, counterName))
			: undefined;
	}

	const isCounterLeft = leftName === counterName;
	const isCounterRight = rightName === counterName;

	if (!isCounterLeft && !isCounterRight) {
		return undefined;
	}

	const { operatorToken } = condition;

	if (isCounterLeft) {
		if (
			operatorToken.kind === SyntaxKind.LessThanToken ||
			operatorToken.kind === SyntaxKind.LessThanEqualsToken
		) {
			return 1;
		}
		if (
			operatorToken.kind === SyntaxKind.GreaterThanToken ||
			operatorToken.kind === SyntaxKind.GreaterThanEqualsToken
		) {
			return -1;
		}
	} else {
		if (
			operatorToken.kind === SyntaxKind.LessThanToken ||
			operatorToken.kind === SyntaxKind.LessThanEqualsToken
		) {
			return -1;
		}
		if (
			operatorToken.kind === SyntaxKind.GreaterThanToken ||
			operatorToken.kind === SyntaxKind.GreaterThanEqualsToken
		) {
			return 1;
		}
	}

	return undefined;
}

function getCounterName(node: AST.Expression) {
	return node.kind === SyntaxKind.Identifier ? node.text : undefined;
}

function getIncrementorDirection(incrementor: AST.Expression) {
	if (
		incrementor.kind === SyntaxKind.PostfixUnaryExpression ||
		incrementor.kind === SyntaxKind.PrefixUnaryExpression
	) {
		switch (incrementor.operator) {
			case SyntaxKind.MinusMinusToken:
				return -1;
			case SyntaxKind.PlusPlusToken:
				return 1;
			default:
				return undefined;
		}
	}

	if (incrementor.kind === SyntaxKind.BinaryExpression) {
		const { operatorToken, right } = incrementor;

		if (
			operatorToken.kind === SyntaxKind.PlusEqualsToken ||
			operatorToken.kind === SyntaxKind.MinusEqualsToken
		) {
			if (right.kind === SyntaxKind.NumericLiteral) {
				const value = Number(right.text);
				if (operatorToken.kind === SyntaxKind.PlusEqualsToken) {
					return value > 0 ? 1 : value < 0 ? -1 : 0;
				}
				return value > 0 ? -1 : value < 0 ? 1 : 0;
			}

			if (
				right.kind === SyntaxKind.PrefixUnaryExpression &&
				right.operator === SyntaxKind.MinusToken &&
				right.operand.kind === SyntaxKind.NumericLiteral
			) {
				const value = Number(right.operand.text);
				if (operatorToken.kind === SyntaxKind.PlusEqualsToken) {
					return value > 0 ? -1 : 1;
				}
				return value > 0 ? 1 : -1;
			}
		}
	}

	return undefined;
}

export default typescriptLanguage.createRule({
	about: {
		description:
			"Reports for loops with counter variables that move in the wrong direction.",
		id: "forDirections",
		preset: "stylistic",
	},
	messages: {
		wrongDirection: {
			primary:
				"The update moves the counter in the wrong direction for this loop condition.",
			secondary: [
				"A for loop with a counter that moves in the wrong direction relative to its stop condition will run infinitely or never execute.",
				"When the counter increases but the condition expects it to decrease (or vice versa), the loop logic is incorrect.",
			],
			suggestions: [
				"Verify the loop counter update direction matches the condition.",
			],
		},
	},
	setup(context) {
		return {
			visitors: {
				ForStatement: (node, { sourceFile }) => {
					if (
						!node.condition ||
						!node.incrementor ||
						!node.initializer ||
						node.initializer.kind !== SyntaxKind.VariableDeclarationList
					) {
						return;
					}

					const declaration = node.initializer.declarations.at(0);
					if (!declaration || declaration.name.kind !== SyntaxKind.Identifier) {
						return;
					}

					const updateDirection = getIncrementorDirection(node.incrementor);
					if (!updateDirection) {
						return;
					}

					const conditionDirection = getConditionDirection(
						node.condition,
						declaration.name.text,
					);

					if (conditionDirection && conditionDirection !== updateDirection) {
						context.report({
							message: "wrongDirection",
							range: getTSNodeRange(node.incrementor, sourceFile),
						});
					}
				},
			},
		};
	},
});
