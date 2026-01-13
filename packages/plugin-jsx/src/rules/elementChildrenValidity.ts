import {
	getTSNodeRange,
	type TypeScriptFileServices,
	typescriptLanguage,
} from "@flint.fyi/ts";
import { SyntaxKind } from "typescript";

const voidElements = new Set([
	"area",
	"base",
	"br",
	"col",
	"embed",
	"hr",
	"img",
	"input",
	"link",
	"meta",
	"param",
	"source",
	"track",
	"wbr",
]);

export default typescriptLanguage.createRule({
	about: {
		description:
			"Reports void DOM elements that have children, which is invalid HTML.",
		id: "elementChildrenValidity",
		preset: "logical",
	},
	messages: {
		voidElementWithChildren: {
			primary:
				"The `<{{ element }}>` element is a void element and cannot have children.",
			secondary: [
				"Void elements are self-closing and cannot contain any content or children.",
				"Remove the children or use a different element type.",
				"This violates HTML specification and may cause rendering issues.",
			],
			suggestions: [
				"Remove the children from the element",
				"Use a self-closing syntax: `<{{ element }} />`",
			],
		},
	},
	setup(context) {
		return {
			visitors: {
				JsxElement(node, { sourceFile }: TypeScriptFileServices) {
					if (!node.children.length) {
						return;
					}

					const openingElement = node.openingElement;
					if (openingElement.tagName.kind !== SyntaxKind.Identifier) {
						return;
					}

					const elementName = openingElement.tagName.text.toLowerCase();
					if (!voidElements.has(elementName)) {
						return;
					}

					context.report({
						data: { element: elementName },
						message: "voidElementWithChildren",
						range: getTSNodeRange(openingElement.tagName, sourceFile),
					});
				},
			},
		};
	},
});
