import { SyntaxKind } from "typescript";

import { getTSNodeRange } from "../getTSNodeRange.ts";
import { typescriptLanguage } from "../language.ts";
import { hasSameTokens } from "../utils/hasSameTokens.ts";

export default typescriptLanguage.createRule({
	about: {
		description:
			"Reports self-assignments which have no effect and are likely errors.",
		id: "selfAssignments",
		preset: "logical",
	},
	messages: {
		selfAssignment: {
			primary: "This value is being assigned to itself, which does nothing.",
			secondary: [
				"Self-assignments have no effect and typically indicate an incomplete refactoring or copy-paste error.",
			],
			suggestions: [
				"Review the assignment and ensure you're assigning the correct value.",
			],
		},
	},
	setup(context) {
		return {
			visitors: {
				BinaryExpression: (node, { sourceFile }) => {
					if (
						node.operatorToken.kind !== SyntaxKind.EqualsToken &&
						node.operatorToken.kind !==
							SyntaxKind.AmpersandAmpersandEqualsToken &&
						node.operatorToken.kind !== SyntaxKind.BarBarEqualsToken &&
						node.operatorToken.kind !== SyntaxKind.QuestionQuestionEqualsToken
					) {
						return;
					}

					if (hasSameTokens(node.left, node.right, sourceFile)) {
						context.report({
							message: "selfAssignment",
							range: getTSNodeRange(node, sourceFile),
						});
					}
				},
			},
		};
	},
});
