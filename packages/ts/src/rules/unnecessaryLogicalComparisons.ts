import {
	type AST,
	getTSNodeRange,
	typescriptLanguage,
	unwrapParenthesizedNode,
} from "@flint.fyi/typescript-language";
import { SyntaxKind } from "typescript";

import { ruleCreator } from "./ruleCreator.ts";
import { isEqualityOperator } from "./utils/operators.ts";

function getBooleanValue(node: AST.BooleanLiteral): boolean {
	return node.kind === SyntaxKind.TrueKeyword;
}

function getSimplifiedExpression(
	variable: AST.Expression,
	booleanValue: boolean,
	isNegatedOperator: boolean,
	sourceFile: AST.SourceFile,
): string {
	const unwrappedVariable = unwrapParenthesizedNode(variable);
	const variableText = unwrappedVariable.getText(sourceFile);

	// For === true or !== false, just use the variable
	if (
		(booleanValue && !isNegatedOperator) ||
		(!booleanValue && isNegatedOperator)
	) {
		return variableText;
	}

	// For === false or !== true, negate the variable
	return `!${variableText}`;
}

function isBooleanLiteral(node: AST.Expression): node is AST.BooleanLiteral {
	const unwrapped = unwrapParenthesizedNode(node);
	return (
		unwrapped.kind === SyntaxKind.TrueKeyword ||
		unwrapped.kind === SyntaxKind.FalseKeyword
	);
}

export default ruleCreator.createRule(typescriptLanguage, {
	about: {
		description: "Simplifies unnecessary boolean literal comparisons.",
		id: "unnecessaryLogicalComparisons",
		presets: ["logical"],
	},
	messages: {
		unnecessaryComparison: {
			primary: "Comparing to a boolean literal is unnecessary.",
			secondary: [
				"This comparison can be simplified to {{ simplifiedText }}.",
				"Boolean values do not need explicit comparison with `true` or `false`.",
			],
			suggestions: [
				"Replace the comparison with {{ simplifiedText }} for clearer intent.",
			],
		},
	},
	setup(context) {
		return {
			visitors: {
				BinaryExpression: (node, { sourceFile }) => {
					if (!isEqualityOperator(node.operatorToken)) {
						return;
					}

					const leftBoolean = isBooleanLiteral(node.left);
					const rightBoolean = isBooleanLiteral(node.right);

					// Need exactly one boolean literal
					if (
						(leftBoolean && rightBoolean) ||
						(!leftBoolean && !rightBoolean)
					) {
						return;
					}

					const isNegatedOperator =
						node.operatorToken.kind ===
							SyntaxKind.ExclamationEqualsEqualsToken ||
						node.operatorToken.kind === SyntaxKind.ExclamationEqualsToken;

					let variable: AST.Expression;
					let booleanNode: AST.BooleanLiteral;

					if (leftBoolean) {
						booleanNode = node.left;
						variable = node.right;
					} else {
						variable = node.left;
						booleanNode = node.right;
					}

					const booleanValue = getBooleanValue(booleanNode);
					const simplifiedText = getSimplifiedExpression(
						variable,
						booleanValue,
						isNegatedOperator,
						sourceFile,
					);

					context.report({
						data: {
							simplifiedText,
						},
						fix: {
							range: getTSNodeRange(node, sourceFile),
							text: simplifiedText,
						},
						message: "unnecessaryComparison",
						range: getTSNodeRange(node, sourceFile),
					});
				},
			},
		};
	},
});
