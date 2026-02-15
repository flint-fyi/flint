import {
	type AST,
	getTSNodeRange,
	hasSameTokens,
	typescriptLanguage,
} from "@flint.fyi/typescript-language";
import ts from "typescript";

import { ruleCreator } from "./ruleCreator.ts";

function getNodeText(node: ts.Node, sourceFile: AST.SourceFile) {
	return sourceFile.text.slice(node.getStart(sourceFile), node.getEnd());
}

export default ruleCreator.createRule(typescriptLanguage, {
	about: {
		description:
			"Reports ternary expressions that can be simplified to boolean expressions or logical operators",
		id: "unnecessaryTernaries",
		presets: ["stylistic", "stylisticStrict"],
	},
	messages: {
		unnecessaryBooleanTernary: {
			primary:
				"This ternary expression can be simplified to a boolean expression.",
			secondary: [
				"Using a ternary to return true or false based on a condition is redundant.",
				"The condition itself already evaluates to a boolean value.",
			],
			suggestions: ["Simplify to a boolean expression."],
		},
		unnecessaryLogicalTernary: {
			primary:
				"This ternary expression can be simplified to a logical operator.",
			secondary: [
				"Using a ternary where the consequent matches the condition is redundant.",
				"A logical OR operator (`||`) expresses the same logic more clearly.",
			],
			suggestions: ["Replace with logical OR operator."],
		},
	},
	setup(context) {
		return {
			visitors: {
				ConditionalExpression(node: AST.ConditionalExpression, { sourceFile }) {
					const { condition, whenFalse, whenTrue } = node;

					// condition ? true : false
					if (
						whenTrue.kind === ts.SyntaxKind.TrueKeyword &&
						whenFalse.kind === ts.SyntaxKind.FalseKeyword
					) {
						const range = getTSNodeRange(node, sourceFile);
						context.report({
							fix: {
								range,
								text: getNodeText(condition, sourceFile),
							},
							message: "unnecessaryBooleanTernary",
							range,
						});
						return;
					}

					// condition ? false : true
					if (
						whenTrue.kind === ts.SyntaxKind.FalseKeyword &&
						whenFalse.kind === ts.SyntaxKind.TrueKeyword
					) {
						const range = getTSNodeRange(node, sourceFile);
						const conditionText = getNodeText(condition, sourceFile);
						const needsParens =
							ts.isBinaryExpression(condition) ||
							ts.isConditionalExpression(condition);

						const negatedCondition = needsParens
							? `!(${conditionText})`
							: `!${conditionText}`;

						context.report({
							fix: {
								range,
								text: negatedCondition,
							},
							message: "unnecessaryBooleanTernary",
							range,
						});
						return;
					}

					// condition ? condition : alternate (when they're equivalent)
					if (hasSameTokens(condition, whenTrue, sourceFile)) {
						const range = getTSNodeRange(node, sourceFile);
						const conditionText = getNodeText(condition, sourceFile);
						const alternateText = getNodeText(whenFalse, sourceFile);

						context.report({
							fix: {
								range,
								text: `${conditionText} || ${alternateText}`,
							},
							message: "unnecessaryLogicalTernary",
							range,
						});
						return;
					}

					// !condition ? alternate : condition
					if (
						ts.isPrefixUnaryExpression(condition) &&
						condition.operator === ts.SyntaxKind.ExclamationToken &&
						hasSameTokens(condition.operand, whenFalse, sourceFile)
					) {
						const range = getTSNodeRange(node, sourceFile);
						const operandText = getNodeText(condition.operand, sourceFile);
						const alternateText = getNodeText(whenTrue, sourceFile);

						context.report({
							fix: {
								range,
								text: `${operandText} || ${alternateText}`,
							},
							message: "unnecessaryLogicalTernary",
							range,
						});
					}
				},
			},
		};
	},
});
