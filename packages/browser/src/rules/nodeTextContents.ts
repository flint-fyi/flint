import { isIdentifier } from "typescript-native/unstable/ast";

import {
	getTSNodeRange,
	isGlobalDeclaration,
	typescriptLanguage,
} from "@flint.fyi/typescript-language";

import { ruleCreator } from "./ruleCreator.ts";

export default ruleCreator.createRule(typescriptLanguage, {
	about: {
		description: "Prefer `textContent` over `innerText` for DOM nodes.",
		id: "nodeTextContents",
		presets: ["logical", "logicalStrict"],
	},
	messages: {
		preferTextContent: {
			primary:
				"Prefer the safer, more performant `textContent` over the legacy `innerText`.",
			secondary: [
				"`textContent` is more performant because it doesn't trigger a reflow.",
				"`textContent` is more widely supported and standard across browsers.",
				"`innerText` is aware of styling and won't return text of hidden elements, which can lead to unexpected behavior.",
			],
			suggestions: ["Replace `innerText` with `textContent`."],
		},
	},
	setup(context) {
		return {
			visitors: {
				PropertyAccessExpression(node, { checker, program, sourceFile }) {
					if (
						isIdentifier(node.name) &&
						node.name.text === "innerText" &&
						isGlobalDeclaration(node.name, checker, program)
					) {
						context.report({
							message: "preferTextContent",
							range: getTSNodeRange(node.name, sourceFile),
						});
					}
				},
			},
		};
	},
});
