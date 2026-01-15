import {
	type AST,
	getTSNodeRange,
	type TypeScriptFileServices,
	typescriptLanguage,
} from "@flint.fyi/typescript-language";
import { SyntaxKind } from "typescript";

const mouseNamesToKeyboardNames = new Map([
	["onMouseOut", "onBlur"],
	["onMouseOver", "onFocus"],
]);

import { ruleCreator } from "./ruleCreator.ts";

export default ruleCreator.createRule(typescriptLanguage, {
	about: {
		description: "Reports mouse events without corresponding keyboard events.",
		id: "mouseEventKeyEvents",
		presets: ["logical"],
	},
	messages: {
		missingKeyEvent: {
			primary:
				"`{{ mouseEvent }}` is missing an accompanying `{{ keyEvent }}` for keyboard accessibility.",
			secondary: [
				"Mouse events should have keyboard equivalents for users who cannot use a mouse.",
				"This ensures that functionality is accessible to all users, such as those with limited hardware or personal disabilities.",
				"Required for WCAG 2.1.1 compliance.",
			],
			suggestions: [
				"Add the corresponding keyboard event handler",
				"Ensure both mouse and keyboard users can access the functionality",
			],
		},
	},
	setup(context) {
		function checkMouseEvents(
			node: AST.JsxOpeningElement | AST.JsxSelfClosingElement,
			{ sourceFile }: TypeScriptFileServices,
		) {
			const { attributes } = node;
			const presentAttributes = new Set<string>();

			for (const property of attributes.properties) {
				if (
					property.kind === SyntaxKind.JsxAttribute &&
					property.name.kind === SyntaxKind.Identifier
				) {
					presentAttributes.add(property.name.text);
				}
			}

			for (const property of attributes.properties) {
				if (
					property.kind !== SyntaxKind.JsxAttribute ||
					property.name.kind !== SyntaxKind.Identifier
				) {
					continue;
				}

				const mouseEvent = property.name.text;
				const keyEvent = mouseNamesToKeyboardNames.get(mouseEvent);

				if (keyEvent && !presentAttributes.has(keyEvent)) {
					context.report({
						data: { keyEvent, mouseEvent },
						message: "missingKeyEvent",
						range: getTSNodeRange(property.name, sourceFile),
					});
				}
			}
		}

		return {
			visitors: {
				JsxOpeningElement: checkMouseEvents,
				JsxSelfClosingElement: checkMouseEvents,
			},
		};
	},
});
