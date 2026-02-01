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
				"Using the expression directly is clearer and has the same code semantics.",
			],
			suggestions: [
				"Remove the template literal wrapper and use the expression directly.",
			],
		},
	},
	setup(context) {
		return {
			visitors: {
				TemplateExpression: (node, { sourceFile }) => {
					if (node.templateSpans.length !== 1) {
						return;
					}

					// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
					const span = node.templateSpans[0]!;

					if (node.head.text !== "" || span.literal.text !== "") {
						return;
					}

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
