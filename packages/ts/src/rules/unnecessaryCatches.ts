import { SyntaxKind } from "typescript";

import { typescriptLanguage } from "../language.ts";

export default typescriptLanguage.createRule({
	about: {
		description:
			"Reports catch clauses that only rethrow the caught error without modification.",
		id: "unnecessaryCatches",
		preset: "logical",
	},
	messages: {
		unnecessaryCatch: {
			primary:
				"This catch clause is unnecessary, as it only rethrows the exception without modification.",
			secondary: [
				"A catch clause that only rethrows the caught error adds no value and creates unnecessary code complexity.",
				"Removing such catch clauses allows errors to propagate naturally without the overhead of an unnecessary try-catch block.",
			],
			suggestions: [
				"Remove the try-catch block if the catch clause only rethrows the error, or add meaningful error handling logic to the catch clause.",
			],
		},
	},
	setup(context) {
		return {
			visitors: {
				CatchClause: (node, { sourceFile }) => {
					if (!node.variableDeclaration) {
						return;
					}

					const statements = node.block.statements;

					if (statements.length !== 1) {
						return;
					}

					// Confirmed by the length check above
					/* eslint-disable-next-line @typescript-eslint/no-non-null-assertion */
					const statement = statements[0]!;

					if (statement.kind !== SyntaxKind.ThrowStatement) {
						return;
					}

					const catchVariable = node.variableDeclaration.name;
					const thrownExpression = statement.expression;

					if (
						catchVariable.kind !== SyntaxKind.Identifier ||
						thrownExpression.kind !== SyntaxKind.Identifier
					) {
						return;
					}

					if (catchVariable.text !== thrownExpression.text) {
						return;
					}

					const range = {
						begin: node.getStart(sourceFile),
						end: node.getStart(sourceFile) + "catch".length,
					};

					context.report({
						fix: {
							range: {
								begin: node.parent.tryBlock.getEnd(),
								end: node.getEnd(),
							},
							text: "",
						},
						message: "unnecessaryCatch",
						range,
					});
				},
			},
		};
	},
});
