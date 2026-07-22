import { SyntaxKind } from "typescript";

import {
	getTSNodeRange,
	typescriptLanguage,
	type AST,
} from "@flint.fyi/typescript-language";

import { ruleCreator } from "./ruleCreator.ts";

export default ruleCreator.createRule(typescriptLanguage, {
	about: {
		description:
			"Reports getters that return literal values instead of using readonly class fields.",
		id: "classLiteralProperties",
		presets: ["stylistic", "stylisticStrict"],
	},
	messages: {
		preferField: {
			primary:
				"Prefer a readonly class field over a getter returning a literal value.",
			secondary: [
				"Readonly fields are more concise and avoid the overhead of a function call.",
				"Getters returning literal values provide no benefit over readonly fields.",
			],
			suggestions: ["Replace this getter with a readonly field."],
		},
	},
	setup(context) {
		return {
			visitors: {
				GetAccessor: (node, { sourceFile }) => {
					if (node.body?.statements.length !== 1) {
						return;
					}

					// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
					const statement = node.body.statements[0]!;
					if (
						statement.kind !== SyntaxKind.ReturnStatement ||
						!statement.expression ||
						!isLiteralValue(statement.expression)
					) {
						return;
					}

					context.report({
						message: "preferField",
						range: getTSNodeRange(node, sourceFile),
					});
				},
			},
		};
	},
});

function isLiteralValue(node: AST.AnyNode): boolean {
	switch (node.kind) {
		case SyntaxKind.BigIntLiteral:
		case SyntaxKind.FalseKeyword:
		case SyntaxKind.NoSubstitutionTemplateLiteral:
		case SyntaxKind.NullKeyword:
		case SyntaxKind.NumericLiteral:
		case SyntaxKind.RegularExpressionLiteral:
		case SyntaxKind.StringLiteral:
		case SyntaxKind.TrueKeyword:
			return true;
		case SyntaxKind.PrefixUnaryExpression:
			return isLiteralValue(node.operand);
		default:
			return false;
	}
}
