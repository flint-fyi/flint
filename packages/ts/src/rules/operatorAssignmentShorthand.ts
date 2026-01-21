import {
	getTSNodeRange,
	hasSameTokens,
	typescriptLanguage,
} from "@flint.fyi/typescript-language";
import ts from "typescript";

import { ruleCreator } from "./ruleCreator.ts";

const commutativeOperatorsWithShorthand = ["*", "&", "^", "|"];
const nonCommutativeOperatorsWithShorthand = [
	"+",
	"-",
	"/",
	"%",
	"<<",
	">>",
	">>>",
	"**",
];

export default ruleCreator.createRule(typescriptLanguage, {
	about: {
		description: "Prefer assignment operator shorthand where possible.",
		id: "operatorAssignmentShorthand",
		presets: ["stylistic"],
	},
	messages: {
		preferShorthand: {
			primary:
				"Assignment (=) can be replaced with operator assignment ({{operator}}).",
		},
	},
	setup(context) {
		return {
			visitors: {
				BinaryExpression: (node, { sourceFile }) => {
					if (node.operatorToken.kind !== ts.SyntaxKind.EqualsToken) {
						return;
					}

					if (!ts.isBinaryExpression(node.right)) {
						return;
					}

					const left = node.left;
					const right = node.right;
					const operatorToken = right.operatorToken.kind;

					let binaryOperator: string | undefined;
					switch (operatorToken) {
						case ts.SyntaxKind.AmpersandToken:
							binaryOperator = "&";
							break;
						case ts.SyntaxKind.AsteriskAsteriskToken:
							binaryOperator = "**";
							break;
						case ts.SyntaxKind.AsteriskToken:
							binaryOperator = "*";
							break;
						case ts.SyntaxKind.BarToken:
							binaryOperator = "|";
							break;
						case ts.SyntaxKind.CaretToken:
							binaryOperator = "^";
							break;
						case ts.SyntaxKind.GreaterThanGreaterThanGreaterThanToken:
							binaryOperator = ">>>";
							break;
						case ts.SyntaxKind.GreaterThanGreaterThanToken:
							binaryOperator = ">>";
							break;
						case ts.SyntaxKind.LessThanLessThanToken:
							binaryOperator = "<<";
							break;
						case ts.SyntaxKind.MinusToken:
							binaryOperator = "-";
							break;
						case ts.SyntaxKind.PercentToken:
							binaryOperator = "%";
							break;
						case ts.SyntaxKind.PlusToken:
							binaryOperator = "+";
							break;
						case ts.SyntaxKind.SlashToken:
							binaryOperator = "/";
							break;
						default:
							return;
					}

					const isCommutative =
						commutativeOperatorsWithShorthand.includes(binaryOperator);
					const isNonCommutative =
						nonCommutativeOperatorsWithShorthand.includes(binaryOperator);

					if (!isCommutative && !isNonCommutative) {
						return;
					}

					// Check if left matches left side of binary expression
					if (hasSameTokens(left, right.left, sourceFile)) {
						const replacementOperator = `${binaryOperator}=`;

						context.report({
							data: { operator: replacementOperator },
							message: "preferShorthand",
							range: getTSNodeRange(node, sourceFile),
						});
					}
					// Check if left matches right side (only for commutative operators)
					else if (
						isCommutative &&
						hasSameTokens(left, right.right, sourceFile)
					) {
						// Cannot fix safely for commutative operators matching on right
						// because custom valueOf() behavior would change execution order
						context.report({
							data: { operator: `${binaryOperator}=` },
							message: "preferShorthand",
							range: getTSNodeRange(node, sourceFile),
						});
					}
				},
			},
		};
	},
});
