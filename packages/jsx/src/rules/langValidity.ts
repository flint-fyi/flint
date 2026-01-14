import {
	type AST,
	getTSNodeRange,
	type TypeScriptFileServices,
	typescriptLanguage,
} from "@flint.fyi/typescript-language";
import languageTags from "language-tags";
import { SyntaxKind } from "typescript";

import { ruleCreator } from "./ruleCreator.ts";

export default ruleCreator.createRule(typescriptLanguage, {
	about: {
		description: "Reports invalid lang attribute values.",
		id: "langValidity",
		presets: ["logical", "logicalStrict"],
	},
	messages: {
		invalidLang: {
			primary:
				"The lang attribute value '{{ value }}' is not a valid BCP 47 language tag.",
			secondary: [
				"The lang attribute must contain a valid BCP 47 language tag.",
				"Valid examples include 'en', 'en-US', 'zh-Hans', or 'fr-CA'.",
				"This is required for WCAG 3.1.2 compliance.",
			],
			suggestions: [
				"Use a valid BCP 47 language tag like 'en' or 'en-US'",
				"Check the language code spelling and format",
			],
		},
	},
	setup(context) {
		function checkElement(
			node: AST.JsxOpeningElement | AST.JsxSelfClosingElement,
			{ sourceFile }: TypeScriptFileServices,
		) {
			const langAttribute = node.attributes.properties.find(
				(property): property is AST.JsxAttribute =>
					property.kind === SyntaxKind.JsxAttribute &&
					property.name.kind === SyntaxKind.Identifier &&
					property.name.text === "lang",
			);

			if (!langAttribute?.initializer) {
				return;
			}

			if (langAttribute.initializer.kind === SyntaxKind.StringLiteral) {
				const langValue = langAttribute.initializer.text;

				if (!languageTags.check(langValue)) {
					context.report({
						data: { value: langValue || "(empty)" },
						message: "invalidLang",
						range: getTSNodeRange(langAttribute.initializer, sourceFile),
					});
				}
			}
		}

		return {
			visitors: {
				JsxOpeningElement: checkElement,
				JsxSelfClosingElement: checkElement,
			},
		};
	},
});
