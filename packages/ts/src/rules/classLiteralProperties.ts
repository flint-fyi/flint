import ts from "typescript";

import { getTSNodeRange } from "../getTSNodeRange.ts";
import type { AST } from "../index.ts";
import { typescriptLanguage } from "../language.ts";

export default typescriptLanguage.createRule({
	about: {
		description:
			"Reports getters that return literal values instead of using readonly class fields.",
		id: "classLiteralProperties",
		preset: "stylistic",
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
						!ts.isReturnStatement(statement) ||
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
		case ts.SyntaxKind.BigIntLiteral:
		case ts.SyntaxKind.FalseKeyword:
		case ts.SyntaxKind.NoSubstitutionTemplateLiteral:
		case ts.SyntaxKind.NullKeyword:
		case ts.SyntaxKind.NumericLiteral:
		case ts.SyntaxKind.RegularExpressionLiteral:
		case ts.SyntaxKind.StringLiteral:
		case ts.SyntaxKind.TrueKeyword:
			return true;
		case ts.SyntaxKind.PrefixUnaryExpression:
			return isLiteralValue(node.operand);
		default:
			return false;
	}
}
