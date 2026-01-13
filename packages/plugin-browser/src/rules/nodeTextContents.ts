import {
	getTSNodeRange,
	isGlobalDeclaration,
	typescriptLanguage,
} from "@flint.fyi/ts";
import { SyntaxKind } from "typescript";

export default typescriptLanguage.createRule({
	about: {
		description: "Prefer `textContent` over `innerText` for DOM nodes.",
		id: "nodeTextContents",
		preset: "logical",
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
				PropertyAccessExpression(node, { sourceFile, typeChecker }) {
					if (
						node.name.kind === SyntaxKind.Identifier &&
						node.name.text === "innerText" &&
						isGlobalDeclaration(node.name, typeChecker)
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
