import type * as yaml from "yaml-unist-parser";

import { yamlLanguage } from "../language.ts";
import { ruleCreator } from "./ruleCreator.ts";

function isSnakeCase(str: string) {
	return /^[a-z][a-z0-9]*(?:_[a-z0-9]+)*$/.test(str);
}

function getKeyValue(node: yaml.MappingKey): string | undefined {
	if (node.children.length === 0) {
		return undefined;
	}

	const child = node.children[0];
	if (!child) {
		return undefined;
	}

	if (
		child.type === "plain" ||
		child.type === "quoteDouble" ||
		child.type === "quoteSingle"
	) {
		return child.value;
	}

	return undefined;
}

export default ruleCreator.createRule(yamlLanguage, {
	about: {
		description: "Enforces consistent casing for mapping keys.",
		id: "mappingKeyCasing",
		presets: ["stylisticStrict"],
	},
	messages: {
		invalidCasing: {
			primary: "Mapping key should use snake_case.",
			secondary: [
				"Using consistent casing for keys improves readability and maintainability.",
				"snake_case is a common convention for YAML configuration files.",
			],
			suggestions: ["Rename the key to use snake_case format."],
		},
	},
	setup(context) {
		return {
			visitors: {
				mappingKey: (node) => {
					const keyValue = getKeyValue(node);

					if (keyValue === undefined) {
						return;
					}

					if (isSnakeCase(keyValue)) {
						return;
					}

					context.report({
						message: "invalidCasing",
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
