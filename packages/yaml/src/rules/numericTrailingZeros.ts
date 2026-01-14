import type * as yaml from "yaml-unist-parser";

import { yamlLanguage } from "../language.ts";
import { ruleCreator } from "./ruleCreator.ts";

function hasTrailingZeros(value: string) {
	const match = /^[+-]?\d+\.(\d+)(?:[eE][+-]?\d+)?$/.exec(value);
	if (!match) {
		return false;
	}

	const decimalPart = match[1];
	if (!decimalPart) {
		return false;
	}

	return /0+$/.test(decimalPart);
}

function isPlainFloat(node: yaml.Plain) {
	return /^[+-]?\d+\.\d+(?:[eE][+-]?\d+)?$/.test(node.value);
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
					if (!isPlainFloat(node)) {
						return;
					}

					if (!hasTrailingZeros(node.value)) {
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
