import {
	isIdentifier,
	isJsxAttribute,
	isJsxExpression,
	isNoSubstitutionTemplateLiteral,
	isStringLiteral,
} from "typescript-native/unstable/ast";

import {
	getTSNodeRange,
	typescriptLanguage,
	type AST,
	type TypeScriptFileServices,
} from "@flint.fyi/typescript-language";

import { ruleCreator } from "./ruleCreator.ts";

export default ruleCreator.createRule(typescriptLanguage, {
	about: {
		description: "Reports <iframe> elements without a title prop.",
		id: "iframeTitles",
		presets: ["logical", "logicalStrict"],
	},
	messages: {
		missingTitle: {
			primary: "This <iframe> element is missing a `title` prop.",
			secondary: [
				"The title attribute provides a label for the iframe that describes its content to screen reader users.",
				"Without it, users may have difficulty understanding the purpose of the iframe.",
				"This is required for WCAG 2.4.1 and 4.1.2 compliance.",
			],
			suggestions: [
				'Add a descriptive title prop (e.g., title="Embedded content")',
				"Ensure the title clearly describes the iframe's content",
			],
		},
	},
	setup(context) {
		function checkIframe(
			{
				attributes,
				tagName,
			}: AST.JsxOpeningElement | AST.JsxSelfClosingElement,
			{ sourceFile }: TypeScriptFileServices,
		) {
			if (!isIdentifier(tagName) || tagName.text.toLowerCase() !== "iframe") {
				return;
			}

			const titleAttribute = attributes.properties.find((property) => {
				return (
					isJsxAttribute(property) &&
					isIdentifier(property.name) &&
					property.name.text.toLowerCase() === "title"
				);
			});

			if (!titleAttribute || !isJsxAttribute(titleAttribute)) {
				context.report({
					message: "missingTitle",
					range: getTSNodeRange(tagName, sourceFile),
				});
				return;
			}

			if (!titleAttribute.initializer) {
				context.report({
					message: "missingTitle",
					range: getTSNodeRange(tagName, sourceFile),
				});
				return;
			}

			if (isStringLiteral(titleAttribute.initializer)) {
				if (titleAttribute.initializer.text === "") {
					context.report({
						message: "missingTitle",
						range: getTSNodeRange(tagName, sourceFile),
					});
				}
			} else if (isJsxExpression(titleAttribute.initializer)) {
				const { expression } = titleAttribute.initializer;
				if (!expression) {
					return;
				}

				if (
					(isStringLiteral(expression) && expression.text === "") ||
					(isNoSubstitutionTemplateLiteral(expression) &&
						expression.text === "") ||
					(isIdentifier(expression) && expression.text === "undefined")
				) {
					context.report({
						message: "missingTitle",
						range: getTSNodeRange(tagName, sourceFile),
					});
				}
			}
		}

		return {
			visitors: {
				JsxOpeningElement: checkIframe,
				JsxSelfClosingElement: checkIframe,
			},
		};
	},
});
