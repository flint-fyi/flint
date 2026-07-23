import { SyntaxKind } from "typescript";

import {
	getTSNodeRange,
	hasSameTokens,
	typescriptLanguage,
} from "@flint.fyi/typescript-language";

import { ruleCreator } from "./ruleCreator.ts";

export default ruleCreator.createRule(typescriptLanguage, {
	about: {
		description: "Prefer logical assignment operator shorthand expressions.",
		id: "assignmentOperatorShorthands",
		presets: ["stylistic", "stylisticStrict"],
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
		function getShorthand(kind: SyntaxKind) {
			switch (kind) {
				case SyntaxKind.AmpersandAmpersandToken:
					return "&&=";
				case SyntaxKind.BarBarToken:
					return "||=";
				case SyntaxKind.QuestionQuestionToken:
					return "??=";
				default:
					return undefined;
			}
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
