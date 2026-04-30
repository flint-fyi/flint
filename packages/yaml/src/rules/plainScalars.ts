import { yamlLanguage } from "@flint.fyi/yaml-language";
import type * as yaml from "yaml-unist-parser";

import { ruleCreator } from "./ruleCreator.ts";

function canBePlain(value: string) {
	return (
		value.length &&
		!value.includes(": ") &&
		!value.includes(" #") &&
		!/[\n\r]/.test(value) &&
		!/\s$/.test(value) &&
		!/^[-?:](?:\s|$)/.test(value) &&
		!/^[\s#&*!|>'"%@`[\]{}]/.test(value) &&
		!/^[+-]?\d+(?:\.\d+)?(?:e[+-]?\d+)?$/i.test(value) &&
		!/^true|false|null|yes|no|on|off|y|n$/i.test(value)
	);
}

export default ruleCreator.createRule(yamlLanguage, {
	about: {
		description: "Prefer plain style scalars over quoted scalars.",
		id: "plainScalars",
		presets: ["stylisticStrict"],
	},
	messages: {
		preferPlain: {
			primary: "Prefer plain scalars over quoted scalars.",
			secondary: [
				"Plain scalars are more readable and concise than quoted scalars.",
				"Quoted scalars should only be used when the value cannot be represented as a plain scalar.",
			],
			suggestions: ["Remove the quotes from the scalar."],
		},
	},
	setup(context) {
		function checkNode(node: yaml.QuoteDouble | yaml.QuoteSingle) {
			if (canBePlain(node.value)) {
				context.report({
					message: "preferPlain",
					range: {
						begin: node.position.start.offset,
						end: node.position.end.offset,
					},
				});
			}
		}
		return {
			visitors: {
				quoteDouble: checkNode,
				quoteSingle: checkNode,
			},
		};
	},
});
