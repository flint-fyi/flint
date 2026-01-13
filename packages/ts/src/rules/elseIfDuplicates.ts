import ts, { SyntaxKind } from "typescript";

import { getTSNodeRange } from "../getTSNodeRange.ts";
import { typescriptLanguage } from "../language.ts";
import * as AST from "../types/ast.ts";
import { hasSameTokens } from "../utils/hasSameTokens.ts";

export default typescriptLanguage.createRule({
	about: {
		description:
			"Reports duplicate conditions in if-else-if chains that make code unreachable.",
		id: "elseIfDuplicates",
		preset: "logical",
	},
	messages: {
		duplicateCondition: {
			primary:
				"This condition is identical to a previous condition in the if-else-if chain.",
			secondary: [
				"When an if-else-if chain has duplicate conditions, the duplicate branch will never execute because the earlier identical condition will always be evaluated first.",
				"This typically indicates a copy-paste error or logic mistake.",
			],
			suggestions: [
				"Verify the condition logic is correct and update to check for the intended condition.",
			],
		},
	},
	setup(context) {
		function checkIfStatement(
			node: AST.IfStatement,
			sourceFile: ts.SourceFile,
		) {
			const seen: AST.Expression[] = [];
			let current: AST.IfStatement = node;

			while (true) {
				if (
					seen.some((previous) =>
						hasSameTokens(previous, current.expression, sourceFile),
					)
				) {
					context.report({
						message: "duplicateCondition",
						range: getTSNodeRange(current.expression, sourceFile),
					});
				}

				if (
					!current.elseStatement ||
					current.elseStatement.kind !== SyntaxKind.IfStatement
				) {
					break;
				}

				seen.push(current.expression);
				current = current.elseStatement;
			}
		}

		return {
			visitors: {
				IfStatement: (node, { sourceFile }) => {
					if (
						node.parent.kind !== SyntaxKind.IfStatement ||
						node.parent.elseStatement !== node
					) {
						checkIfStatement(node, sourceFile);
					}
				},
			},
		};
	},
});
