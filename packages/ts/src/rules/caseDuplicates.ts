import { SyntaxKind } from "typescript";

import { typescriptLanguage } from "../language.ts";
import * as AST from "../types/ast.ts";
import { hasSameTokens } from "../utils/hasSameTokens.ts";

export default typescriptLanguage.createRule({
	about: {
		description:
			"Reports switch statements with duplicate case clause test expressions.",
		id: "caseDuplicates",
		preset: "logical",
	},
	messages: {
		duplicateCase: {
			primary:
				"This case duplicates a previous case, so it will never be reached.",
			secondary: [
				"Having duplicate case clauses in a switch statement is a logic error.",
				"The second case clause will never be reached because the first matching case will always execute first.",
			],
			suggestions: [
				"Remove the duplicate case clause or modify its test expression to be unique.",
			],
		},
	},
	setup(context) {
		return {
			visitors: {
				SwitchStatement: (node, { sourceFile }) => {
					const seenCases: AST.Expression[] = [];

					for (const clause of node.caseBlock.clauses) {
						if (clause.kind !== SyntaxKind.CaseClause) {
							continue;
						}

						const isDuplicate = seenCases.some((seenCase) =>
							hasSameTokens(seenCase, clause.expression, sourceFile),
						);

						if (isDuplicate) {
							context.report({
								message: "duplicateCase",
								range: {
									begin: clause.getStart(sourceFile),
									end: clause.expression.getEnd(),
								},
							});
						} else {
							seenCases.push(clause.expression);
						}
					}
				},
			},
		};
	},
});
