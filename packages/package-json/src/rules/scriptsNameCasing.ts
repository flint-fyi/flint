import { kebabCase } from "change-case";

import { getNodeRange, jsonLanguage } from "@flint.fyi/json-language";

import { getPackagePropertyOfName } from "../getPackagePropertyOfName.ts";
import { ruleCreator } from "../ruleCreator.ts";

// See https://docs.npmjs.com/cli/v11/using-npm/scripts
const builtinCamelCaseScripts = new Set(["prepublishOnly"]);

export default ruleCreator.createRule(jsonLanguage, {
	about: {
		description: "Enforce that names for scripts properties are in kebab case.",
		id: "scriptsNameCasing",
		presets: ["stylistic"],
	},
	messages: {
		invalidCase: {
			primary:
				"Prefer the standard kebab-case style for `scripts` names (optionally with `:` separators).",
			secondary: [
				"The keys in an object-form package.json `scripts` field become command names for installed package executables.",
				"Kebab-case command names are the standard convention for CLI executables.",
			],
			suggestions: ["Convert the command name to kebab case."],
		},
	},
	setup(context) {
		return {
			visitors: {
				Document(node) {
					const property = getPackagePropertyOfName(node, "scripts");
					if (property?.value.type !== "Object") {
						return;
					}

					for (const scriptsProperty of property.value.members) {
						if (
							scriptsProperty.name.type !== "String" ||
							builtinCamelCaseScripts.has(scriptsProperty.name.value)
						) {
							continue;
						}

						const propertyName = scriptsProperty.name.value;
						const kebabCasePropertyName = propertyName
							.split(":")
							.map((segment) => kebabCase(segment))
							.join(":");

						if (propertyName === kebabCasePropertyName) {
							continue;
						}

						const range = getNodeRange(scriptsProperty.name);

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
