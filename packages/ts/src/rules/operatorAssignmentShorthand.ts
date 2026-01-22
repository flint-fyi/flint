import {
	type AST,
	getTSNodeRange,
	hasSameTokens,
	typescriptLanguage,
} from "@flint.fyi/typescript-language";
import ts from "typescript";

import { ruleCreator } from "./ruleCreator.ts";

const operatorTexts = new Map([
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
						node.operatorToken.kind !== ts.SyntaxKind.EqualsToken ||
						!ts.isBinaryExpression(node.right)
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
