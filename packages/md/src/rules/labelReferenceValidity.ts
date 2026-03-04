import { markdownLanguage } from "@flint.fyi/markdown-language";

import { ruleCreator } from "./ruleCreator.ts";

const invalidPattern = /\[[^\]]+\]\[\s+\]/g;

export default ruleCreator.createRule(markdownLanguage, {
	about: {
		description: "Reports invalid label references with whitespace.",
		id: "labelReferenceValidity",
		presets: ["logical"],
	},
	messages: {
		invalidWhitespace: {
			primary: "This label reference has invalid whitespace between brackets.",
			secondary: [
				"CommonMark's shorthand label reference syntax ([label][]) does not allow whitespace between the brackets.",
				"While GitHub may render this correctly, CommonMark-compliant renderers will not treat this as a link reference.",
				"Remove the whitespace between the brackets to make this valid across all Markdown renderers.",
			],
			suggestions: [
				"Remove whitespace between the brackets",
				"Use the full reference syntax: [label][label]",
			],
		},
	},
	setup(context) {
		return {
			visitors: {
				text(node) {
					let match: null | RegExpExecArray;

					while ((match = invalidPattern.exec(node.value))) {
						const begin = node.position.start.offset + match.index;
						const end = begin + match[0].length;

						context.report({
							message: "invalidWhitespace",
							range: {
								begin,
								end,
							},
						});
					}
				},
			},
		};
	},
});
