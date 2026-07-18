import * as tsutils from "ts-api-utils";
import { SyntaxKind } from "typescript";

import {
	getTSNodeRange,
	hasSameTokens,
	typescriptLanguage,
	unwrapParenthesizedNode,
	type AST,
} from "@flint.fyi/typescript-language";

import { ruleCreator } from "./ruleCreator.ts";

export default ruleCreator.createRule(typescriptLanguage, {
	about: {
		description:
			"Prefer using .at() for accessing elements at negative indices.",
		id: "atAccesses",
		presets: ["stylistic", "stylisticStrict"],
	},
	messages: {
		preferAt: {
			primary:
				"Prefer using .at() with a negative index instead of calculating length minus an offset.",
			secondary: [
				"The .at() method provides a cleaner way to access elements from the end of an array or string.",
				"Using .at(-1) is more readable than array[array.length - 1].",
			],
			suggestions: [
				"Use .at() with a negative index to access elements from the end.",
			],
		},
	},
	setup(context) {
		return {
			visitors: {
				ElementAccessExpression: (node, { sourceFile }) => {
					if (!isLeftHandSide(node) && isLengthMinusAccess(node, sourceFile)) {
						context.report({
							message: "preferAt",
							range: getTSNodeRange(node, sourceFile),
						});
					}
				},
			},
		};
	},
});

function isLeftHandSide(node: AST.ElementAccessExpression) {
	switch (node.parent.kind) {
		case SyntaxKind.ArrayLiteralExpression: {
			return (
				node.parent.parent.kind === SyntaxKind.BinaryExpression &&
				tsutils.isAssignmentKind(node.parent.parent.operatorToken.kind) &&
				node.parent.parent.left === node.parent
			);
		}

		case SyntaxKind.BinaryExpression:
			return (
				tsutils.isAssignmentKind(node.parent.operatorToken.kind) &&
				node.parent.left === node
			);

		case SyntaxKind.DeleteExpression:
			return true;

		case SyntaxKind.PostfixUnaryExpression:
		case SyntaxKind.PrefixUnaryExpression:
			return node.parent.operand === node;

		case SyntaxKind.PropertyAssignment:
		case SyntaxKind.ShorthandPropertyAssignment: {
			return (
				node.parent.parent.parent.kind === SyntaxKind.BinaryExpression &&
				tsutils.isAssignmentKind(
					node.parent.parent.parent.operatorToken.kind,
				) &&
				node.parent.parent.parent.left === node.parent.parent
			);
		}
	}

	return false;
}

function isLengthMinusAccess(
	node: AST.ElementAccessExpression,
	sourceFile: AST.SourceFile,
) {
	const argument = unwrapParenthesizedNode(node.argumentExpression);

	if (
		argument.kind !== SyntaxKind.BinaryExpression ||
		argument.operatorToken.kind !== SyntaxKind.MinusToken
	) {
		return false;
	}

	const left = unwrapParenthesizedNode(argument.left);
	if (
		left.kind !== SyntaxKind.PropertyAccessExpression ||
		left.name.text !== "length" ||
		!hasSameTokens(left.expression, node.expression, sourceFile)
	) {
		return false;
	}

	const right = unwrapParenthesizedNode(argument.right);
	if (right.kind !== SyntaxKind.NumericLiteral) {
		return false;
	}

	const offset = Number(right.text);
	if (!Number.isInteger(offset) || offset <= 0) {
		return false;
	}

	return true;
}
