import { typescriptLanguage } from "@flint.fyi/typescript-language";

import { ruleCreator } from "./ruleCreator.ts";

export default ruleCreator.createRule(typescriptLanguage, {
	about: {
		description:
			"Reports template expressions that can be replaced with simpler expressions.",
		id: "unnecessaryTemplateExpressions",
		presets: ["logical", "logicalStrict"],
	},
	messages: {
		unnecessaryTemplateExpression: {
			primary:
				"This template expression can be replaced with a simpler expression.",
			secondary: [
				"Template expressions that contain only a single substitution without surrounding text add unnecessary complexity.",
				"Using the expression directly is clearer and more maintainable.",
			],
			suggestions: [
				"Remove the template literal wrapper and use the expression directly, or use String() for explicit string coercion if needed.",
			],
		},
	},
	setup(context) {
		return {
			visitors: {
				TemplateExpression: (node, { sourceFile }) => {
					// Check if the template has only one span and no static text
					if (node.templateSpans.length !== 1) {
						return;
					}

					const span = node.templateSpans[0];

					// Check if head is empty and tail is empty
					if (node.head.text !== "" || span.literal.text !== "") {
						return;
					}

					// Report the unnecessary template expression
					context.report({
						message: "unnecessaryTemplateExpression",
						range: {
							begin: node.getStart(sourceFile),
							end: node.getStart(sourceFile) + 1,
						},
					});
				},
			},
		};
	},
});
