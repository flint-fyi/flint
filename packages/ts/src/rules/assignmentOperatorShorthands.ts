import * as ts from "typescript";

import { getTSNodeRange } from "../getTSNodeRange.ts";
import { typescriptLanguage } from "../language.ts";
import { hasSameTokens } from "../utils/hasSameTokens.ts";

export default typescriptLanguage.createRule({
	about: {
		description: "Prefer logical assignment operator shorthand expressions.",
		id: "assignmentOperatorShorthands",
		preset: "stylistic",
	},
	messages: {
		preferShorthand: {
			primary:
				"Prefer the logical assignment operator shorthand `{{ operator }}`.",
			secondary: [
				"Logical assignment operators are more concise and express the intent more clearly.",
				"They were introduced in ES2021 and are supported in all modern environments.",
			],
			suggestions: ["Use the shorthand operator `{{ operator }}`."],
		},
	},
	setup(context) {
		function getShorthand(kind: ts.SyntaxKind) {
			switch (kind) {
				case ts.SyntaxKind.AmpersandAmpersandToken:
					return "&&=";
				case ts.SyntaxKind.BarBarToken:
					return "||=";
				case ts.SyntaxKind.QuestionQuestionToken:
					return "??=";
				default:
					return undefined;
			}
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

					const shorthand = getShorthand(node.right.operatorToken.kind);
					if (!shorthand) {
						return;
					}

					if (!hasSameTokens(node.left, node.right.left, sourceFile)) {
						return;
					}

					const range = getTSNodeRange(node, sourceFile);

					const leftText = node.left.getText(sourceFile);
					const rightText = node.right.right.getText(sourceFile);
					const fixedText = `${leftText} ${shorthand} ${rightText}`;

					context.report({
						data: { operator: shorthand },
						fix: {
							range,
							text: fixedText,
						},
						message: "preferShorthand",
						range,
					});
				},
			},
		};
	},
});
