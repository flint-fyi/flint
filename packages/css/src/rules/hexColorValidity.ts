import { cssLanguage, getCssNodeRange } from "@flint.fyi/css-language";

import { ruleCreator } from "../ruleCreator.ts";

const validityTester = /^(?:[0-9a-f]{3,4}){1,2}$/i;

export default ruleCreator.createRule(cssLanguage, {
	about: {
		description: "Reports hex colors with invalid values.",
		id: "hexColorValidity",
		presets: ["logical"],
	},
	messages: {
		invalid: {
			primary: "The hex value `{{ value }}` is invalid.",
			secondary: [
				"Valid CSS hex colors must have 3, 4, 6, or 8 digits or letters in `a-f` after the `#`.",
				"This value does not match that criteria.",
			],
			suggestions: ["Fix the value to be a valid CSS hex color."],
		},
	},
	setup(context) {
		return {
			visitors: {
				Hash: (node) => {
					if (!validityTester.test(node.value)) {
						context.report({
							data: {
								value: node.value,
							},
							message: "invalid",
							range: getCssNodeRange(node),
						});
					}
				},
			},
		};
	},
});
