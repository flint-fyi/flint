import { yamlLanguage } from "@flint.fyi/yaml-language";

import { ruleCreator } from "./ruleCreator.ts";

const boolPattern =
	/^(?:true|True|TRUE|false|False|FALSE|yes|Yes|YES|no|No|NO|on|On|ON|off|Off|OFF)$/;
const intPattern = /^[-+]?(?:0|[1-9]\d*|0o[0-7]+|0x[\da-f]+)$/i;
const floatPattern =
	/^[-+]?(?:\.\d+|\d+(?:\.\d*)?)(?:e[-+]?\d+)?$|^[-+]?\.inf$|^\.nan$/i;
const nullPattern = /^(?:~|null|Null|NULL)?$/;

function isNonStringPlainScalar(value: string): boolean {
	return (
		nullPattern.test(value) ||
		boolPattern.test(value) ||
		intPattern.test(value) ||
		floatPattern.test(value)
	);
}

export default ruleCreator.createRule(yamlLanguage, {
	about: {
		description: "Enforces mapping keys to be strings.",
		id: "stringMappingKeys",
		presets: ["logical", "logicalStrict"],
	},
	messages: {
		nonStringKey: {
			primary: "Mapping keys should be strings.",
			secondary: [
				"Non-string keys can cause interoperability issues with parsers and programming languages that expect string keys.",
				"Using non-string keys makes YAML documents harder to read and may lead to unexpected behavior.",
			],
			suggestions: [
				"Convert the keys to strings.",
				"Switch to a different data structure, as multiple entries in arrays.",
			],
		},
	},
	setup(context) {
		return {
			visitors: {
				mappingKey: (node) => {
					if (node.children.length === 0) {
						return;
					}

					const [keyContent] = node.children;

					switch (keyContent.type) {
						case "plain":
							if (isNonStringPlainScalar(keyContent.value)) {
								context.report({
									message: "nonStringKey",
									range: {
										begin: keyContent.position.start.offset,
										end: keyContent.position.end.offset,
									},
								});
							}
							break;

						case "quoteDouble":
						case "quoteSingle":
							break;

						default:
							context.report({
								message: "nonStringKey",
								range: {
									begin: keyContent.position.start.offset,
									end: keyContent.position.end.offset,
								},
							});
							break;
					}
				},
			},
		};
	},
});
