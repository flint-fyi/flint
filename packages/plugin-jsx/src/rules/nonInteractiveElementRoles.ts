import {
	type AST,
	getTSNodeRange,
	type TypeScriptFileServices,
	typescriptLanguage,
} from "@flint.fyi/ts";
import { SyntaxKind } from "typescript";

const nonInteractiveElements = new Set([
	"article",
	"aside",
	"body",
	"br",
	"details",
	"div",
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

const interactiveRoles = new Set([
	"button",
	"checkbox",
	"link",
	"menuitem",
	"menuitemcheckbox",
	"menuitemradio",
	"option",
	"radio",
	"searchbox",
	"slider",
	"spinbutton",
	"switch",
	"tab",
	"textbox",
]);

const allowedExceptions: Record<string, Set<string> | undefined> = {
	li: new Set(["menuitem", "option", "row", "tab", "treeitem"]),
	ol: new Set([
		"listbox",
		"menu",
		"menubar",
		"radiogroup",
		"tablist",
		"tree",
		"treegrid",
	]),
	table: new Set(["grid"]),
	td: new Set(["gridcell"]),
	ul: new Set([
		"listbox",
		"menu",
		"menubar",
		"radiogroup",
		"tablist",
		"tree",
		"treegrid",
	]),
};

export default typescriptLanguage.createRule({
	about: {
		description:
			"Reports non-interactive elements with interactive ARIA roles.",
		id: "nonInteractiveElementRoles",
		preset: "logical",
	},
	messages: {
		invalidRole: {
			primary:
				"Non-interactive element <{{ element }}> should not have the interactive role `'{{ role }}'`.",
			secondary: [
				"Non-interactive elements should not be converted to interactive controls using ARIA roles.",
				"Use native interactive elements like <button> or <a> instead.",
				"This is required for WCAG 4.1.2 compliance.",
			],
			suggestions: [
				"Use a native interactive element instead",
				"Remove the role attribute",
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
			if (!nonInteractiveElements.has(elementName)) {
				return;
			}

			const roleProperty = element.attributes.properties.find(
				(property) =>
					property.kind === SyntaxKind.JsxAttribute &&
					property.name.kind === SyntaxKind.Identifier &&
					property.name.text === "role",
			);

			if (
				!roleProperty ||
				roleProperty.kind !== SyntaxKind.JsxAttribute ||
				!roleProperty.initializer ||
				roleProperty.initializer.kind !== SyntaxKind.StringLiteral
			) {
				return;
			}

			const role = roleProperty.initializer.text;

			if (
				interactiveRoles.has(role) &&
				!allowedExceptions[elementName]?.has(role)
			) {
				context.report({
					data: { element: elementName, role },
					message: "invalidRole",
					range: getTSNodeRange(roleProperty, sourceFile),
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
