import { SyntaxKind } from "typescript";

import { typescriptLanguage, type AST } from "@flint.fyi/typescript-language";

import { ruleCreator } from "./ruleCreator.ts";

function isIfStatementGuard(node: AST.IfStatement) {
	if (node.thenStatement.kind === SyntaxKind.ContinueStatement) {
		return true;
	}

	if (
		node.thenStatement.kind === SyntaxKind.Block &&
		node.thenStatement.statements.length === 1 &&
		// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
		node.thenStatement.statements[0]!.kind === SyntaxKind.ContinueStatement
	) {
		return true;
	}

	return false;
}

export default ruleCreator.createRule(typescriptLanguage, {
	about: {
		description:
			"Reports for-in loops without an if statement to filter inherited properties.",
		id: "forInGuards",
	},
	messages: {
		missingGuard: {
			primary:
				"For-in loop body should be wrapped in an if statement to filter inherited properties.",
			secondary: [
				"Looping over objects with a for-in loop will include properties inherited through the prototype chain.",
				"This behavior can lead to unexpected items being iterated over.",
			],
			suggestions: [
				"Wrap the loop body with `if (Object.hasOwn(object, key))` or `if (Object.prototype.hasOwnProperty.call(object, key))`.",
			],
		},
	},
	setup(context) {
		return {
			visitors: {
				ForInStatement: (node, { sourceFile }) => {
					switch (node.statement.kind) {
						case SyntaxKind.EmptyStatement:
						case SyntaxKind.IfStatement:
							return;

						case SyntaxKind.Block: {
							if (!node.statement.statements.length) {
								return;
							}

							// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
							const firstStatement = node.statement.statements[0]!;

							if (
								firstStatement.kind === SyntaxKind.IfStatement &&
								(node.statement.statements.length === 1 ||
									isIfStatementGuard(firstStatement))
							) {
								return;
							}
						}
					}

					context.report({
						message: "missingGuard",
						range: {
							begin: node.getStart(sourceFile),
							end: node.statement.getStart(sourceFile),
						},
					});
				},
			},
		};
	},
});
