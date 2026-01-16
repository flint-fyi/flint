import { yamlLanguage } from "@flint.fyi/yaml-language";

import { ruleCreator } from "./ruleCreator.ts";

export default ruleCreator.createRule(yamlLanguage, {
	about: {
		description: "Reports empty mapping values.",
		id: "emptyMappingValues",
		presets: ["logical"],
	},
	messages: {
		emptyValue: {
			primary: "This mapping has an empty value, which is often a mistake.",
			secondary: [
				"Empty values can lead to unexpected runtime behavior when parsers interpret them as null or empty strings.",
				"If an empty value is intentional, use explicit null to clarify intent.",
			],
			suggestions: [
				"Remove the mapping key if it is not needed.",
				"Use an explicit `null` to clarify intent.",
				"Add one or more values to the mapping.",
			],
		},
	},
	setup(context) {
		return {
			visitors: {
				mappingValue: (node) => {
					if (node.children.length === 0) {
						context.report({
							message: "emptyValue",
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
