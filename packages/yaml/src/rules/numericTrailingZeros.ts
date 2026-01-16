import { yamlLanguage } from "@flint.fyi/yaml-language";
import type * as yaml from "yaml-unist-parser";

import { ruleCreator } from "./ruleCreator.ts";

function hasTrailingZeros(value: string) {
	const match = /^[+-]?\d+\.(\d+)(?:e[+-]?\d+)?$/i.exec(value);
	// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
	return match && /0+$/.test(match[1]!);
}

function isPlainFloat(node: yaml.Plain) {
	return /^[+-]?\d+\.\d+(?:e[+-]?\d+)?$/i.test(node.value);
}

export default ruleCreator.createRule(yamlLanguage, {
	about: {
		description: "Reports trailing zeros in numeric values.",
		id: "numericTrailingZeros",
		presets: ["stylistic"],
	},
	messages: {
		trailingZeros: {
			primary: "Numeric value has unnecessary trailing zeros.",
			secondary: [
				"Trailing zeros in decimal numbers are unnecessary and can be removed without changing the value.",
				"Removing trailing zeros makes numeric values more concise and easier to read.",
			],
			suggestions: ["Remove the trailing zeros."],
		},
	},
	setup(context) {
		return {
			visitors: {
				plain: (node) => {
					if (!isPlainFloat(node) || !hasTrailingZeros(node.value)) {
						return;
					}

					context.report({
						message: "trailingZeros",
						range: {
							begin: node.position.start.offset,
							end: node.position.end.offset,
						},
					});
				},
			},
		};
	},
});
