import { yamlLanguage } from "../language.ts";
import { ruleCreator } from "./ruleCreator.ts";

const nullPattern = /^(?:~|null|Null|NULL)?$/;
const boolPattern =
	/^(?:true|True|TRUE|false|False|FALSE|yes|Yes|YES|no|No|NO|on|On|ON|off|Off|OFF)$/;
const intPattern = /^[-+]?(?:0|[1-9]\d*|0o[0-7]+|0x[\dA-Fa-f]+)$/;
const floatPattern =
	/^[-+]?(?:\.\d+|\d+(?:\.\d*)?)(?:[eE][-+]?\d+)?$|^[-+]?\.(?:inf|Inf|INF)$|^\.(?:nan|NaN|NAN)$/;

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
		presets: ["logical"],
		strictness: "strict",
	},
	messages: {
		nonStringKey: {
			primary: "Mapping keys should be strings.",
			secondary: [
				"Non-string keys can cause interoperability issues with parsers and programming languages that expect string keys.",
				"Using non-string keys makes YAML documents harder to read and may lead to unexpected behavior.",
			],
			suggestions: ["TODO"],
		},
	},
	setup(context) {
		return {
			visitors: {
				mappingKey: (node) => {
					if (node.children.length === 0) {
						return;
					}

					const keyContent = node.children[0];

					if (
						keyContent.type !== "plain" &&
						keyContent.type !== "quoteSingle" &&
						keyContent.type !== "quoteDouble"
					) {
						context.report({
							message: "nonStringKey",
							range: {
								begin: keyContent.position.start.offset,
								end: keyContent.position.end.offset,
							},
						});
						return;
					}

					if (
						keyContent.type === "plain" &&
						isNonStringPlainScalar(keyContent.value)
					) {
						context.report({
							message: "nonStringKey",
							range: {
								begin: keyContent.position.start.offset,
								end: keyContent.position.end.offset,
							},
						});
					}
				},
			},
		};
	},
});
