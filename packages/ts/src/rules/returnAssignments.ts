import * as tsutils from "ts-api-utils";
import ts, { SyntaxKind } from "typescript";

import { getTSNodeRange } from "../getTSNodeRange.ts";
import { typescriptLanguage } from "../language.ts";
import * as AST from "../types/ast.ts";
import { unwrapParenthesizedExpression } from "../utils/unwrapParenthesizedExpression.ts";

export default typescriptLanguage.createRule({
	about: {
		description: "Reports using assignment expressions in return statements.",
		id: "returnAssignments",
		preset: "stylistic",
	},
	messages: {
		noReturnAssign: {
			primary:
				"Placing an assignment inside a return statement can be misleading and is often a sign of a logical mistake.",
			secondary: [
				"Using assignments in return statements can make code harder to read and can lead to confusion about whether the assignment or the returned value is the primary intent.",
				"Assignment expressions return the assigned value, but mixing assignment with return makes the control flow less clear.",
			],
			suggestions: [
				"Perform the assignment on a separate line before the return statement.",
			],
		},
	},
	setup(context) {
		function checkForAssignment(
			node: AST.ConciseBody | AST.Expression,
			sourceFile: ts.SourceFile,
		): void {
			const unwrapped = unwrapParenthesizedExpression(node);

			if (
				unwrapped.kind === SyntaxKind.BinaryExpression &&
				tsutils.isAssignmentKind(unwrapped.operatorToken.kind)
			) {
				context.report({
					message: "noReturnAssign",
					range: getTSNodeRange(unwrapped.operatorToken, sourceFile),
				});
			}
		}

		return {
			visitors: {
				ArrowFunction: (node, { sourceFile }) => {
					if (node.body.kind !== SyntaxKind.Block) {
						checkForAssignment(node.body, sourceFile);
					}
				},
				ReturnStatement: (node, { sourceFile }) => {
					if (node.expression) {
						checkForAssignment(node.expression, sourceFile);
					}
				},
			},
		};
	},
});
