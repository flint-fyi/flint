import {
	type AST,
	getTSNodeRange,
	hasSameTokens,
	typescriptLanguage,
	unwrapParenthesizedNode,
} from "@flint.fyi/typescript-language";
import * as tsutils from "ts-api-utils";
import * as ts from "typescript";

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
		case ts.SyntaxKind.ArrayLiteralExpression: {
			return (
				ts.isBinaryExpression(node.parent.parent) &&
				tsutils.isAssignmentKind(node.parent.parent.operatorToken.kind) &&
				node.parent.parent.left === node.parent
			);
		}

		case ts.SyntaxKind.BinaryExpression:
			return (
				tsutils.isAssignmentKind(node.parent.operatorToken.kind) &&
				node.parent.left === node
			);

		case ts.SyntaxKind.DeleteExpression:
			return true;

		case ts.SyntaxKind.PostfixUnaryExpression:
		case ts.SyntaxKind.PrefixUnaryExpression:
			return node.parent.operand === node;

		case ts.SyntaxKind.PropertyAssignment:
		case ts.SyntaxKind.ShorthandPropertyAssignment: {
			return (
				node.parent.parent.parent.kind === ts.SyntaxKind.BinaryExpression &&
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
		!ts.isBinaryExpression(argument) ||
		argument.operatorToken.kind !== ts.SyntaxKind.MinusToken
	) {
		return false;
	}

	const left = unwrapParenthesizedNode(argument.left);
	if (
		!ts.isPropertyAccessExpression(left) ||
		left.name.text !== "length" ||
		!hasSameTokens(left.expression, node.expression, sourceFile)
	) {
		return false;
	}

	const right = unwrapParenthesizedNode(argument.right);
	if (!ts.isNumericLiteral(right)) {
		return false;
	}

	const offset = Number(right.text);
	if (!Number.isInteger(offset) || offset <= 0) {
		return false;
	}

	return true;
}
