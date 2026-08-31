import {
	getTSNodeRange,
	typescriptLanguage,
} from "@flint.fyi/typescript-language";

import { isLanguageCreateRule } from "../utils/ruleCreatorHelpers.ts";
import { ruleCreator } from "./ruleCreator.ts";

export default ruleCreator.createRule(typescriptLanguage, {
	about: {
		description:
			"Reports plugin rules created directly with language instead of through RuleCreator.",
		id: "ruleCreationMethods",
		presets: ["logical"],
	},
	messages: {
		ruleCreationMethods: {
			primary:
				"Plugin rules should be created through RuleCreator instead of calling language.createRule() directly.",
			secondary: [
				"Direct language creation bypasses the standardized rule metadata and documentation provided by RuleCreator.",
				"RuleCreator adds the `docs` property and ensures consistent rule structure across plugins.",
			],
			suggestions: [
				"Create an instance of RuleCreator from `@flint.fyi/core` (e.g. `const ruleCreator = new RuleCreator({ presets: [...] })`), then use `ruleCreator.createRule(language, { ... })` instead of `language.createRule({ ... })`.",
			],
		},
	},
	setup(context) {
		return {
			visitors: {
				CallExpression(node, { checker, sourceFile }) {
					if (!isLanguageCreateRule(node, checker)) {
						return;
					}

					context.report({
						message: "ruleCreationMethods",
						range: getTSNodeRange(node.expression, sourceFile),
					});
				},
			},
		};
	},
});
