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

const interactiveElements = new Set([
	"a",
	"button",
	"input",
	"select",
	"textarea",
]);

export default typescriptLanguage.createRule({
	about: {
		description:
			"Reports static elements with event handlers that lack ARIA roles.",
		id: "staticElementInteractions",
		preset: "logical",
	},
	messages: {
		missingRole: {
			primary:
				"This static element that handles events is missing a role attribute.",
			secondary: [
				"Static HTML elements like <div> and <span> have no semantic meaning.",
				"Interactive handlers require a role to convey purpose to assistive technology and search engine crawlers.",
				"Required for WCAG 4.1.2 compliance.",
			],
			suggestions: [
				"Add a role attribute (e.g. `role='button'`)",
				"Use a semantic HTML element instead (e.g. `<button>`)",
			],
		},
	},
	setup(context) {
		function checkElement(
			node: AST.JsxOpeningElement | AST.JsxSelfClosingElement,
			{ sourceFile }: TypeScriptFileServices,
		) {
			if (
				node.tagName.kind !== SyntaxKind.Identifier ||
				node.tagName.text.toLowerCase() !== node.tagName.text
			) {
				return;
			}

			const elementName = node.tagName.text.toLowerCase();
			if (interactiveElements.has(elementName)) {
				return;
			}

			let hadInteractiveHandler = false;

			for (const property of node.attributes.properties) {
				if (
					property.kind === SyntaxKind.JsxAttribute &&
					property.name.kind === SyntaxKind.Identifier
				) {
					if (property.name.text === "role") {
						return;
					}

					if (interactiveHandlers.includes(property.name.text)) {
						hadInteractiveHandler = true;
					}
				}
			}

			if (!hadInteractiveHandler) {
				return;
			}

			context.report({
				message: "missingRole",
				range: getTSNodeRange(node.tagName, sourceFile),
			});
		}

		return {
			visitors: {
				JsxOpeningElement: checkElement,
				JsxSelfClosingElement: checkElement,
			},
		};
	},
});
