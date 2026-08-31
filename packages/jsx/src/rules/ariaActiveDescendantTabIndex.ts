import { isIdentifier, isJsxAttribute } from "typescript-native/unstable/ast";

import {
	getTSNodeRange,
	typescriptLanguage,
	type AST,
	type TypeScriptFileServices,
} from "@flint.fyi/typescript-language";

import { ruleCreator } from "./ruleCreator.ts";

const inherentlyTabbableElements = new Set([
	"a",
	"area",
	"button",
	"input",
	"select",
	"textarea",
]);

export default ruleCreator.createRule(typescriptLanguage, {
	about: {
		description:
			"Reports elements with aria-activedescendant without tabIndex.",
		id: "ariaActiveDescendantTabIndex",
		presets: ["logical", "logicalStrict"],
	},
	messages: {
		missingTabIndex: {
			primary:
				"This element with `aria-activedescendant` is missing a `tabIndex` attribute to manage focus state.",
			secondary: [
				"aria-activedescendant is used to manage focus within a composite widget.",
				"The element must be tabbable, either with an inherent tabIndex or explicit tabIndex attribute.",
				"Without it, keyboard users cannot reach the element.",
			],
			suggestions: [
				'Add tabIndex="0" to make the element tabbable',
				'Add tabIndex="-1" to make it programmatically focusable',
			],
		},
	},
	setup(context) {
		function checkElement(
			{
				attributes,
				tagName,
			}: AST.JsxOpeningElement | AST.JsxSelfClosingElement,
			{ sourceFile }: TypeScriptFileServices,
		) {
			if (isIdentifier(tagName)) {
				const firstCharacter = tagName.text.charAt(0);
				if (
					firstCharacter === firstCharacter.toUpperCase() &&
					firstCharacter !== firstCharacter.toLowerCase()
				) {
					return;
				}
			}

			if (
				!attributes.properties.some(
					(property) =>
						isJsxAttribute(property) &&
						isIdentifier(property.name) &&
						property.name.text === "aria-activedescendant" &&
						property.initializer,
				)
			) {
				return;
			}

			if (
				isIdentifier(tagName) &&
				inherentlyTabbableElements.has(tagName.text.toLowerCase())
			) {
				return;
			}

			const hasTabIndex = attributes.properties.some(
				(property) =>
					isJsxAttribute(property) &&
					isIdentifier(property.name) &&
					property.name.text.toLowerCase() === "tabindex",
			);

			if (!hasTabIndex) {
				const ariaProperty = attributes.properties.find(
					(property) =>
						isJsxAttribute(property) &&
						isIdentifier(property.name) &&
						property.name.text === "aria-activedescendant",
				);

				if (ariaProperty && isJsxAttribute(ariaProperty)) {
					context.report({
						message: "missingTabIndex",
						range: getTSNodeRange(ariaProperty, sourceFile),
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
