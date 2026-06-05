import { kebabCase } from "change-case";
import ts from "typescript";

import { getJsonNodeRange, jsonLanguage } from "@flint.fyi/json-language";

import { getPackagePropertyOfName } from "../getPackagePropertyOfName.ts";
import { ruleCreator } from "../ruleCreator.ts";

// See https://docs.npmjs.com/cli/v11/using-npm/scripts
const builtinCamelCaseScripts = new Set(["prepublishOnly"]);

// flint-disable-next-line ts/deprecated
// eslint-disable-next-line @typescript-eslint/no-deprecated
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
				JsonSourceFile(node) {
					const property = getPackagePropertyOfName(node, "scripts");
					if (
						property?.kind !== ts.SyntaxKind.PropertyAssignment ||
						property.initializer.kind !== ts.SyntaxKind.ObjectLiteralExpression
					) {
						return;
					}

					for (const scriptsProperty of property.initializer.properties) {
						if (
							scriptsProperty.kind !== ts.SyntaxKind.PropertyAssignment ||
							scriptsProperty.name.kind !== ts.SyntaxKind.StringLiteral ||
							builtinCamelCaseScripts.has(scriptsProperty.name.text)
						) {
							continue;
						}

						const propertyName = scriptsProperty.name.text;
						const kebabCasePropertyName = propertyName
							.split(":")
							.map((segment) => kebabCase(segment))
							.join(":");

						if (propertyName === kebabCasePropertyName) {
							continue;
						}

						const range = getJsonNodeRange(scriptsProperty.name, node);

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
