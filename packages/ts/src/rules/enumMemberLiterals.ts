import {
	type AST,
	getTSNodeRange,
	typescriptLanguage,
} from "@flint.fyi/typescript-language";
import { SyntaxKind } from "typescript";

import { ruleCreator } from "./ruleCreator.ts";

function isLiteralExpression(expression: AST.Expression): boolean {
	switch (expression.kind) {
		case SyntaxKind.NoSubstitutionTemplateLiteral:
		case SyntaxKind.NumericLiteral:
		case SyntaxKind.StringLiteral:
			return true;

		case SyntaxKind.PrefixUnaryExpression: {
			if (
				expression.operator === SyntaxKind.PlusToken ||
				expression.operator === SyntaxKind.MinusToken
			) {
				return expression.operand.kind === SyntaxKind.NumericLiteral;
			}

			return false;
		}

		default:
			return false;
	}
}

export default ruleCreator.createRule(typescriptLanguage, {
	about: {
		description: "Requires all enum members to be literal values.",
		id: "enumMemberLiterals",
		presets: ["logicalStrict"],
	},
	messages: {
		requireLiteral: {
			primary:
				"Prefer initializing enum members with literal values for predictability.",
			secondary: [
				"Using computed values in enum initializers can lead to unexpected results.",
				"Enum members create their own scope, so variable references may not work as expected.",
			],
			suggestions: [
				"Use a literal string or number value instead of a computed expression.",
			],
		},
	},
	setup(context) {
		return {
			visitors: {
				EnumMember: (node, { sourceFile }) => {
					if (node.initializer && !isLiteralExpression(node.initializer)) {
						context.report({
							message: "requireLiteral",
							range: getTSNodeRange(node, sourceFile),
						});
					}
				},
			},
		};
	},
});
