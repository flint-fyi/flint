import { SyntaxKind } from "typescript";

import { getTSNodeRange } from "../getTSNodeRange.ts";
import { typescriptLanguage } from "../language.ts";
import * as AST from "../types/ast.ts";
import { ruleCreator } from "./ruleCreator.ts";

function isLiteralExpression(expression: AST.Expression): boolean {
	switch (expression.kind) {
		case SyntaxKind.NoSubstitutionTemplateLiteral:
		case SyntaxKind.NumericLiteral:
		case SyntaxKind.StringLiteral:
			return true;
		case SyntaxKind.PrefixUnaryExpression: {
			const unary = expression;

			if (
				unary.operator === SyntaxKind.PlusToken ||
				unary.operator === SyntaxKind.MinusToken
			) {
				return unary.operand.kind === SyntaxKind.NumericLiteral;
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
		presets: ["logical"],
	},
	messages: {
		requireLiteral: {
			primary: "Enum members should be initialized with literal values.",
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
					const initializer = node.initializer;

					if (!initializer) {
						return;
					}

					if (isLiteralExpression(initializer)) {
						return;
					}

					context.report({
						message: "requireLiteral",
						range: getTSNodeRange(node, sourceFile),
					});
				},
			},
		};
	},
});
