import {
	type AST,
	getTSNodeRange,
	type TypeScriptFileServices,
	typescriptLanguage,
} from "@flint.fyi/ts";
import { SyntaxKind } from "typescript";

const interactiveHandlers = [
	"onClick",
	"onKeyDown",
	"onKeyPress",
	"onKeyUp",
	"onMouseDown",
	"onMouseUp",
];

const nonInteractiveElements = new Set([
	"area",
	"article",
	"aside",
	"body",
	"br",
	"details",
	"footer",
	"h1",
	"h2",
	"h3",
	"h4",
	"h5",
	"h6",
	"header",
	"hr",
	"img",
	"li",
	"main",
	"nav",
	"ol",
	"p",
	"section",
	"table",
	"td",
	"ul",
]);

const nonInteractiveRoles = new Set([
	"article",
	"banner",
	"complementary",
	"img",
	"listitem",
	"main",
	"navigation",
	"region",
	"tooltip",
]);

export default typescriptLanguage.createRule({
	about: {
		description:
			"Reports non-interactive elements with interactive event handlers.",
		id: "nonInteractiveElementInteractions",
		preset: "logical",
	},
	messages: {
		invalidHandler: {
			primary:
				"`<{{ element }}>` elements are non-interactive and so should not have interactive event handlers.",
			secondary: [
				"Non-interactive elements indicate content and containers in the user interface.",
				"Use native interactive elements like <button> or <a> instead, or add an interactive role.",
				"This is required for WCAG 4.1.2 compliance.",
			],
			suggestions: [
				"Use a native interactive element instead (e.g. <button>)",
				"Add an interactive role attribute (e.g. role='button')",
				"Move the handler to an inner element with an interactive role",
			],
		},
	},
	setup(context) {
		function checkElement(
			element: AST.JsxOpeningElement | AST.JsxSelfClosingElement,
			{ sourceFile }: TypeScriptFileServices,
		) {
			if (element.tagName.kind !== SyntaxKind.Identifier) {
				return;
			}

			const elementName = element.tagName.text.toLowerCase();
			if (
				elementName !== element.tagName.text ||
				!nonInteractiveElements.has(elementName)
			) {
				return;
			}

			let hasInteractiveHandler = false;

			for (const property of element.attributes.properties) {
				if (
					property.kind === SyntaxKind.JsxAttribute &&
					property.name.kind === SyntaxKind.Identifier
				) {
					if (
						property.name.text === "role" &&
						property.initializer &&
						property.initializer.kind === SyntaxKind.StringLiteral &&
						!nonInteractiveRoles.has(property.initializer.text)
					) {
						return;
					}

					if (interactiveHandlers.includes(property.name.text)) {
						hasInteractiveHandler = true;
					}
				}
			}

			if (hasInteractiveHandler) {
				context.report({
					data: { element: elementName },
					message: "invalidHandler",
					range: getTSNodeRange(element.tagName, sourceFile),
				});
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
