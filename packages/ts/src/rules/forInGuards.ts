import ts from "typescript";

import { typescriptLanguage } from "../language.ts";
import { ruleCreator } from "./ruleCreator.ts";

function isIfStatementGuard(node: ts.IfStatement) {
	const consequent = node.thenStatement;

	if (ts.isContinueStatement(consequent)) {
		return true;
	}

	if (
		ts.isBlock(consequent) &&
		consequent.statements.length === 1 &&
		ts.isContinueStatement(consequent.statements[0])
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
		presets: ["logical"],
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
				"Wrap the loop body with `if (Object.hasOwn(obj, key))` or `if (Object.prototype.hasOwnProperty.call(obj, key))`.",
			],
		},
	},
	setup(context) {
		return {
			visitors: {
				ForInStatement: (node, { sourceFile }) => {
					const body = node.statement;

					if (ts.isEmptyStatement(body)) {
						return;
					}

					if (ts.isIfStatement(body)) {
						return;
					}

					if (ts.isBlock(body)) {
						if (body.statements.length === 0) {
							return;
						}

						if (
							body.statements.length === 1 &&
							ts.isIfStatement(body.statements[0])
						) {
							return;
						}

						const firstStatement = body.statements[0];
						if (
							firstStatement &&
							ts.isIfStatement(firstStatement) &&
							isIfStatementGuard(firstStatement)
						) {
							return;
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
