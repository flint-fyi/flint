import z from "zod/v4";

import { getJsonNodeRange, jsonLanguage } from "@flint.fyi/json-language/new";

import { ruleCreator } from "./ruleCreator.ts";

export default ruleCreator.createRule(jsonLanguage, {
	about: {
		description:
			"Reports object keys that are not normalized using Unicode normalization forms.",
		id: "keyNormalization",
		presets: ["logical", "logicalStrict"],
	},
	messages: {
		unnormalizedKey: {
			primary:
				"This key is not normalized using the {{ form }} normalization form.",
			secondary: [
				"Unicode characters can sometimes have multiple representations that look identical but are technically different character sequences.",
				"Using normalized Unicode ensures consistent representation of text, which is important for key comparison, sorting, and searching operations.",
			],
			suggestions: [
				"Normalize the key using the {{ form }} normalization form.",
			],
		},
	},
	options: {
		form: z
			.enum(["NFC", "NFD", "NFKC", "NFKD"])
			.default("NFC")
			.describe(
				"Unicode normalization form to use when checking keys. Must be one of: NFC (default), NFD, NFKC, or NFKD.",
			),
	},
	setup(context) {
		return {
			visitors: {
				Object(node, { options: { form } }) {
					for (const property of node.members) {
						if (property.name.type !== "String") {
							continue;
						}

						const key = property.name.value;
						const normalizedKey = key.normalize(form);

						if (key === normalizedKey) {
							continue;
						}

						const range = getJsonNodeRange(property.name);
						context.report({
							data: { form },
							message: "unnormalizedKey",
							range,
							suggestions: [
								{
									id: "normalizeKey",
									range: {
										begin: range.begin + 1,
										end: range.end - 1,
									},
									text: normalizedKey,
								},
							],
						});
					}
				},
			},
		};
	},
});
