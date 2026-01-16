import { yamlLanguage } from "@flint.fyi/yaml-language";

import { ruleCreator } from "./ruleCreator.ts";

export default ruleCreator.createRule(yamlLanguage, {
	about: {
		description: "Reports empty sequence entries.",
		id: "emptySequenceEntries",
		presets: ["logical"],
	},
	messages: {
		emptyEntry: {
			primary: "This sequence has an empty entry, which is often a mistake.",
			secondary: [
				"Empty entries in sequences can lead to unexpected null values in the parsed data.",
				"If an empty entry is intentional, use explicit null to clarify intent.",
			],
			suggestions: [
				"Remove the empty entry entirely.",
				"Add content to the entry if it was intended to hold data.",
			],
		},
	},
	setup(context) {
		return {
			visitors: {
				sequenceItem: (node) => {
					if (node.children.length === 0) {
						context.report({
							message: "emptyEntry",
							range: {
								begin: node.position.start.offset,
								end: node.position.end.offset,
							},
						});
					}
				},
			},
		};
	},
});
