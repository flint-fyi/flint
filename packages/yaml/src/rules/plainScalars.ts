import type * as yaml from "yaml-unist-parser";

import { yamlLanguage } from "../language.ts";
import { ruleCreator } from "./ruleCreator.ts";

function canBePlain(value: string) {
	if (value.length === 0) {
		return false;
	}

	if (/^[\s#&*!|>'"%@`[\]{}]/.test(value)) {
		return false;
	}

	if (/[\s]$/.test(value)) {
		return false;
	}

	if (value.includes(": ") || value.includes(" #")) {
		return false;
	}

	if (/^[-?:](?:\s|$)/.test(value)) {
		return false;
	}

	if (/^(true|false|null|yes|no|on|off|y|n)$/i.test(value)) {
		return false;
	}

	if (/^[+-]?\d+(\.\d+)?([eE][+-]?\d+)?$/.test(value)) {
		return false;
	}

	if (/[\n\r]/.test(value)) {
		return false;
	}

	return true;
}

function handleQuotedNode(
	node: yaml.QuoteDouble | yaml.QuoteSingle,
	context: Parameters<Parameters<typeof ruleCreator.createRule>[1]["setup"]>[0],
) {
	if (!canBePlain(node.value)) {
		return;
	}

	context.report({
		message: "preferPlain",
		range: {
			begin: node.position.start.offset,
			end: node.position.end.offset,
		},
	});
}

export default ruleCreator.createRule(yamlLanguage, {
	about: {
		description: "Prefer plain style scalars over quoted scalars.",
		id: "plainScalars",
		presets: ["stylisticStrict"],
	},
	messages: {
		preferPlain: {
			primary: "Prefer plain scalar over quoted scalar.",
			secondary: [
				"Plain scalars are more readable and concise than quoted scalars.",
				"Quoted scalars should only be used when the value cannot be represented as a plain scalar.",
			],
			suggestions: ["Remove the quotes from the scalar."],
		},
	},
	setup(context) {
		return {
			visitors: {
				quoteDouble: (node) => {
					handleQuotedNode(node, context);
				},
				quoteSingle: (node) => {
					handleQuotedNode(node, context);
				},
			},
		};
	},
});
