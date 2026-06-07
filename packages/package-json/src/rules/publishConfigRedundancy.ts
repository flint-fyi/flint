import { getJsonNodeRange, jsonLanguage } from "@flint.fyi/json-language/new";

import { getPackagePropertiesOfNames } from "../getPackagePropertiesOfNames.ts";
import { removeObjectProperty } from "../removeObjectProperty.ts";
import { ruleCreator } from "../ruleCreator.ts";

export default ruleCreator.createRule(jsonLanguage, {
	about: {
		description:
			"Reports `publishConfig.access` fields that do not affect unscoped packages.",
		id: "publishConfigRedundancy",
		presets: ["logical"],
	},
	messages: {
		redundantAccess: {
			primary:
				"Unscoped packages are always published with public access, so this field has no effect.",
			secondary: [
				"`publishConfig.access` only changes publishing access for scoped packages.",
			],
			suggestions: ["Remove the redundant access field."],
		},
	},
	setup(context) {
		return {
			visitors: {
				Document(node) {
					const { name, publishConfig } = getPackagePropertiesOfNames(node, [
						"name",
						"publishConfig",
					]);

					if (
						name?.value.type !== "String" ||
						name.value.value.startsWith("@")
					) {
						return;
					}

					if (publishConfig?.value.type !== "Object") {
						return;
					}

					const publishConfigValue = publishConfig.value;

					for (const property of publishConfigValue.members) {
						if (
							property.name.type === "String" &&
							property.name.value === "access"
						) {
							const { range, text } = removeObjectProperty(
								property,
								publishConfigValue,
							);

							context.report({
								message: "redundantAccess",
								range: getJsonNodeRange(property.name),
								suggestions: [
									{
										id: "removeAccess",
										range,
										text,
									},
								],
							});

							return;
						}
					}
				},
			},
		};
	},
});
