import { nullThrows } from "@flint.fyi/utils";
import { SyntaxKind } from "typescript";

import { typescriptLanguage } from "../language.ts";

export default typescriptLanguage.createRule({
	about: {
		description:
			"Reports switch statements where the default clause is not last.",
		id: "defaultCaseLast",
		preset: "logical",
	},
	messages: {
		defaultCaseShouldBeLast: {
			primary: "Default clauses in switch statements should be last.",
			secondary: [
				"Placing the default clause in a position other than last can lead to confusion and unexpected behavior.",
				"While the default clause is executed when no case matches, having it in the middle of other cases makes the control flow harder to follow.",
			],
			suggestions: [
				"Move the default clause to the end of the switch statement to improve code clarity.",
			],
		},
	},
	setup(context) {
		return {
			visitors: {
				SwitchStatement: (node, { sourceFile }) => {
					const clauses = node.caseBlock.clauses;
					const defaultClauseIndex = clauses.findIndex(
						(clause) => clause.kind === SyntaxKind.DefaultClause,
					);

					if (
						defaultClauseIndex === -1 ||
						defaultClauseIndex === clauses.length - 1
					) {
						return;
					}

					const defaultClause = nullThrows(
						clauses[defaultClauseIndex],
						"Default clause is expected to be present by prior length check",
					);

					context.report({
						message: "defaultCaseShouldBeLast",
						range: {
							begin: defaultClause.getStart(sourceFile),
							end: defaultClause.getStart(sourceFile) + "default".length,
						},
					});
				},
			},
		};
	},
});
