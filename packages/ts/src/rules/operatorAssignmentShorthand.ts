import { SyntaxKind } from "typescript";

import {
	getTSNodeRange,
	hasSameTokens,
	typescriptLanguage,
	type AST,
} from "@flint.fyi/typescript-language";

import { ruleCreator } from "./ruleCreator.ts";

const operatorTexts = new Map([
	[SyntaxKind.AmpersandToken, "&"],
	[SyntaxKind.AsteriskAsteriskToken, "**"],
	[SyntaxKind.AsteriskToken, "*"],
	[SyntaxKind.BarToken, "|"],
	[SyntaxKind.CaretToken, "^"],
	[SyntaxKind.GreaterThanGreaterThanGreaterThanToken, ">>>"],
	[SyntaxKind.GreaterThanGreaterThanToken, ">>"],
	[SyntaxKind.LessThanLessThanToken, "<<"],
	[SyntaxKind.MinusToken, "-"],
	[SyntaxKind.PercentToken, "%"],
	[SyntaxKind.PlusToken, "+"],
	[SyntaxKind.SlashToken, "/"],
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
		presets: ["stylistic", "stylisticStrict"],
	},
	messages: {
		preferShorthand: {
			primary:
				"This `=` assignment can be replaced with an `{{ operator }}=` operator assignment.",
			secondary: [
				"The shorthand operator assignment accomplishes the same operation with less code.",
			],
			suggestions: [
				"Switch the `=` assignment with an `{{ operator }}` operator assignment.",
			],
		},
	},
	setup(context) {
		function report(
			operator: string,
			node: AST.BinaryExpression,
			right: AST.AnyNode,
			sourceFile: AST.SourceFile,
		) {
			const range = getTSNodeRange(node, sourceFile);

			context.report({
				data: { operator },
				fix: {
					range,
					text: [
						node.left.getText(sourceFile),
						`${operator}=`,
						right.getText(sourceFile),
					].join(" "),
				},
				message: "preferShorthand",
				range,
			});
		}

		return {
			visitors: {
				BinaryExpression: (node, { sourceFile }) => {
					if (
						node.operatorToken.kind !== SyntaxKind.EqualsToken ||
						node.right.kind !== SyntaxKind.BinaryExpression
					) {
						return;
					}

					const operator = operatorTexts.get(node.right.operatorToken.kind);
					if (!operator) {
						return;
					}

					const isCommutative = commutativeOperatorsWithShorthand.has(operator);

					if (
						!isCommutative &&
						!nonCommutativeOperatorsWithShorthand.has(operator)
					) {
						return;
					}

					if (hasSameTokens(node.left, node.right.left, sourceFile)) {
						report(operator, node, node.right.right, sourceFile);
					} else if (
						isCommutative &&
						hasSameTokens(node.left, node.right.right, sourceFile)
					) {
						report(operator, node, node.right.left, sourceFile);
					}
				},
			},
		};
	},
});
