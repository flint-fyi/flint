import { typescriptLanguage } from "@flint.fyi/typescript-language";
import * as ts from "typescript";
import { SyntaxKind } from "typescript";

import { ruleCreator } from "./ruleCreator.ts";

export default ruleCreator.createRule(typescriptLanguage, {
	about: {
		description: "Disallows non-null assertions.",
		id: "nonNullAssertions",
		presets: ["logicalStrict"],
	},
	messages: {
		nonNullAssertion: {
			primary: "Non-null assertions bypass TypeScript's strict null checking.",
			secondary: [
				"The non-null assertion operator (`!`) tells TypeScript to trust that a value is not `null` or `undefined`.",
				"This can mask potential bugs when the value actually is `null` or `undefined` at runtime.",
			],
			suggestions: [
				"Use type guards, nullish coalescing (`??`), or optional chaining (`?.`) instead.",
			],
		},
	},
	setup(context) {
		return {
			visitors: {
				NonNullExpression: (node) => {
					const range = {
						begin: node.expression.getEnd(),
						end: node.getEnd(),
					};

					function getSuggestionText() {
						if (
							ts.isPropertyAccessChain(node.expression) ||
							ts.isElementAccessChain(node.expression) ||
							ts.isCallChain(node.expression)
						) {
							return undefined;
						}

						switch (node.parent.kind) {
							case ts.SyntaxKind.CallExpression:
								return node.parent.expression === node && "?.";

							case ts.SyntaxKind.ElementAccessExpression:
								return (
									node.parent.expression === node &&
									!isAssignmentLeft(node.parent) &&
									"?."
								);

							case ts.SyntaxKind.PropertyAccessExpression:
								return (
									node.parent.expression === node &&
									!isAssignmentLeft(node.parent) &&
									"?"
								);
						}

						return undefined;
					}

					const suggestionText = getSuggestionText();

					const suggestions = suggestionText
						? [
								{
									id: "optionalChain",
									range: {
										begin: node.expression.getEnd(),
										end: node.expression.getEnd() + 1,
									},
									text: suggestionText,
								},
							]
						: undefined;

					context.report({
						message: "nonNullAssertion",
						range,
						suggestions,
					});
				},
			},
		};
	},
});

function isAssignmentLeft(node: ts.Node): boolean {
	return (
		ts.isBinaryExpression(node.parent) &&
		node.parent.operatorToken.kind === SyntaxKind.EqualsToken &&
		node.parent.left === node
	);
}
