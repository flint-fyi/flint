import {
	getTSNodeRange,
	hasSameTokens,
	typescriptLanguage,
} from "@flint.fyi/typescript-language";
import ts from "typescript";

import { ruleCreator } from "./ruleCreator.ts";

const operatorTokenTexts = new Map([
	[ts.SyntaxKind.AmpersandToken, "&"],
	[ts.SyntaxKind.AsteriskAsteriskToken, "**"],
	[ts.SyntaxKind.AsteriskToken, "*"],
	[ts.SyntaxKind.BarToken, "|"],
	[ts.SyntaxKind.CaretToken, "^"],
	[ts.SyntaxKind.GreaterThanGreaterThanGreaterThanToken, ">>>"],
	[ts.SyntaxKind.GreaterThanGreaterThanToken, ">>"],
	[ts.SyntaxKind.LessThanLessThanToken, "<<"],
	[ts.SyntaxKind.MinusToken, "-"],
	[ts.SyntaxKind.PercentToken, "%"],
	[ts.SyntaxKind.PlusToken, "+"],
	[ts.SyntaxKind.SlashToken, "/"],
]);

const commutativeOperatorsWithShorthand = new Set(["&", "*", "^", "|"]);

const nonCommutativeOperatorsWithShorthand = new Set([
	"%",
	"**",
	"+",
	"-",
	"/",
	"<<",
	">>",
	">>>",
]);

export default ruleCreator.createRule(typescriptLanguage, {
	about: {
		description: "Prefer assignment operator shorthand where possible.",
		id: "operatorAssignmentShorthand",
		presets: ["stylistic"],
	},
	messages: {
		preferShorthand: {
			primary:
				"This `=` assignment can be replaced with an `{{ operator }}` operator assignment.",
			secondary: [
				"The shorthand operator assignment accomplishes the same operation with less code.",
			],
			suggestions: [
				"Switch the `=` assignment with an `{{ operator }}` operator assignment.",
			],
		},
	},
	setup(context) {
		return {
			visitors: {
				BinaryExpression: (node, { sourceFile }) => {
					if (
						node.operatorToken.kind !== ts.SyntaxKind.EqualsToken ||
						!ts.isBinaryExpression(node.right)
					) {
						return;
					}

					const binaryOperator = operatorTokenTexts.get(
						node.right.operatorToken.kind,
					);
					if (!binaryOperator) {
						return;
					}

					const isCommutative =
						commutativeOperatorsWithShorthand.has(binaryOperator);

					if (
						!isCommutative &&
						!nonCommutativeOperatorsWithShorthand.has(binaryOperator)
					) {
						return;
					}

					if (hasSameTokens(node.left, node.right.left, sourceFile)) {
						const replacementOperator = `${binaryOperator}=`;
						const range = getTSNodeRange(node, sourceFile);
						const leftText = node.left.getText(sourceFile);
						const rightText = node.right.right.getText(sourceFile);
						const fixedText = `${leftText} ${replacementOperator} ${rightText}`;

						context.report({
							data: { operator: replacementOperator },
							fix: {
								range,
								text: fixedText,
							},
							message: "preferShorthand",
							range,
						});
					} else if (
						isCommutative &&
						hasSameTokens(node.left, node.right.right, sourceFile)
					) {
						const replacementOperator = `${binaryOperator}=`;
						const range = getTSNodeRange(node, sourceFile);
						const leftText = node.left.getText(sourceFile);
						const rightText = node.right.left.getText(sourceFile);
						const fixedText = `${leftText} ${replacementOperator} ${rightText}`;

						context.report({
							data: { operator: replacementOperator },
							fix: {
								range,
								text: fixedText,
							},
							message: "preferShorthand",
							range,
						});
					}
				},
			},
		};
	},
});
