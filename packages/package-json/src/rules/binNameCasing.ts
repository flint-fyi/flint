import { kebabCase } from "change-case";

import { getNodeRange, jsonLanguage } from "@flint.fyi/json-language";

import { getPackagePropertyOfName } from "../getPackagePropertyOfName.ts";
import { ruleCreator } from "../ruleCreator.ts";

export default ruleCreator.createRule(jsonLanguage, {
	about: {
		description: "Enforce that names for bin properties are in kebab case.",
		id: "binNameCasing",
		presets: ["stylistic"],
	},
	messages: {
		invalidCase: {
			primary: "Prefer the standard kebab-case style for `bin` commands.",
			secondary: [
				"The keys in an object-form package.json `bin` field become command names for installed package executables.",
				"Kebab-case command names are the standard convention for CLI executables.",
			],
			suggestions: ["Convert the command name to kebab case."],
		},
	},
	setup(context) {
		return {
			visitors: {
				Document(node) {
					const property = getPackagePropertyOfName(node, "bin");
					if (property?.value.type !== "Object") {
						return;
					}

					for (const binProperty of property.value.members) {
						if (binProperty.name.type !== "String") {
							continue;
						}

						const propertyName = binProperty.name.value;
						const kebabCasePropertyName = kebabCase(propertyName);

						if (propertyName === kebabCasePropertyName) {
							continue;
						}

						const range = getNodeRange(binProperty.name);

						context.report({
							message: "invalidCase",
							range,
							suggestions: [
								{
									id: "convertToKebabCase",
									range,
									text: JSON.stringify(kebabCasePropertyName),
								},
							],
						});
					}
				},
			},
		};
	},
});
