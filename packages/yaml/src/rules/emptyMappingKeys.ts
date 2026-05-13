import { yamlLanguage } from "@flint.fyi/yaml-language";

import { ruleCreator } from "./ruleCreator.ts";

export default ruleCreator.createRule(yamlLanguage, {
	about: {
		description: "Reports empty mapping keys.",
		id: "emptyMappingKeys",
		presets: ["logical"],
	},
	messages: {
		emptyKey: {
			primary: "This mapping has an empty key, which is often a mistake.",
			secondary: [
				"Empty keys are invalid in YAML and may cause parsers to reject the document or misinterpret its structure.",
				"Even if allowed by a parser, empty keys can be confusing for developers and lead to accidental mistakes in code.",
			],
			suggestions: [
				"Remove the mapping entry if it is not needed.",
				"Add a key name to the mapping.",
			],
		},
	},
	setup(context) {
		return {
			visitors: {
				mappingKey: (node) => {
					if (!node.children.length) {
						context.report({
							message: "emptyKey",
							range: {
								begin: node.position.start.offset,
								end: node.position.end.offset + 1,
							},
						});
					}
				},
			},
		};
	},
});
