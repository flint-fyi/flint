import {
	type AST,
	getTSNodeRange,
	type TypeScriptFileServices,
	typescriptLanguage,
} from "@flint.fyi/ts";
import { SyntaxKind } from "typescript";

const inherentlyTabbableElements = new Set([
	"a",
	"area",
	"button",
	"input",
	"select",
	"textarea",
]);

export default typescriptLanguage.createRule({
	about: {
		description:
			"Reports elements with aria-activedescendant without tabIndex.",
		id: "ariaActiveDescendantTabIndex",
		preset: "logical",
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
			if (tagName.kind === SyntaxKind.Identifier) {
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
						property.kind === SyntaxKind.JsxAttribute &&
						property.name.kind === SyntaxKind.Identifier &&
						property.name.text === "aria-activedescendant" &&
						property.initializer,
				)
			) {
				return;
			}

			if (tagName.kind === SyntaxKind.Identifier) {
				if (inherentlyTabbableElements.has(tagName.text.toLowerCase())) {
					return;
				}
			}

			const hasTabIndex = attributes.properties.some(
				(property) =>
					property.kind === SyntaxKind.JsxAttribute &&
					property.name.kind === SyntaxKind.Identifier &&
					property.name.text.toLowerCase() === "tabindex",
			);

			if (!hasTabIndex) {
				const ariaProperty = attributes.properties.find(
					(property) =>
						property.kind === SyntaxKind.JsxAttribute &&
						property.name.kind === SyntaxKind.Identifier &&
						property.name.text === "aria-activedescendant",
				);

				if (ariaProperty && ariaProperty.kind === SyntaxKind.JsxAttribute) {
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
