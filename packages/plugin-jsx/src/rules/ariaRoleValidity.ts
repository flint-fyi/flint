import {
	type AST,
	getTSNodeRange,
	type TypeScriptFileServices,
	typescriptLanguage,
} from "@flint.fyi/ts";
import { SyntaxKind } from "typescript";

const validAriaRoles = new Set([
	"alert",
	"alertdialog",
	"application",
	"article",
	"banner",
	"button",
	"cell",
	"checkbox",
	"columnheader",
	"combobox",
	"complementary",
	"contentinfo",
	"definition",
	"dialog",
	"directory",
	"document",
	"feed",
	"figure",
	"form",
	"grid",
	"gridcell",
	"group",
	"heading",
	"img",
	"link",
	"list",
	"listbox",
	"listitem",
	"log",
	"main",
	"marquee",
	"math",
	"menu",
	"menubar",
	"menuitem",
	"menuitemcheckbox",
	"menuitemradio",
	"meter",
	"navigation",
	"none",
	"note",
	"option",
	"presentation",
	"progressbar",
	"radio",
	"radiogroup",
	"region",
	"row",
	"rowgroup",
	"rowheader",
	"scrollbar",
	"search",
	"searchbox",
	"separator",
	"slider",
	"spinbutton",
	"status",
	"switch",
	"tab",
	"table",
	"tablist",
	"tabpanel",
	"term",
	"textbox",
	"timer",
	"toolbar",
	"tooltip",
	"tree",
	"treegrid",
	"treeitem",
]);

export default typescriptLanguage.createRule({
	about: {
		description: "Reports invalid or abstract ARIA roles.",
		id: "ariaRoleValidity",
		preset: "logical",
	},
	messages: {
		invalidRole: {
			primary:
				"Invalid ARIA role '{{ role }}'. Use a valid, non-abstract role.",
			secondary: [
				"ARIA roles must be valid according to the WAI-ARIA specification.",
				"Abstract roles cannot be used directly in HTML.",
				"Required for WCAG 4.1.2 compliance.",
			],
			suggestions: [
				"Use a valid ARIA role from the WAI-ARIA specification",
				"Remove the role attribute if not needed",
			],
		},
	},
	setup(context) {
		function checkRole(
			node: AST.JsxOpeningElement | AST.JsxSelfClosingElement,
			{ sourceFile }: TypeScriptFileServices,
		) {
			if (
				node.tagName.kind !== SyntaxKind.Identifier ||
				node.tagName.text.toLowerCase() !== node.tagName.text
			) {
				return;
			}

			const roleProperty = node.attributes.properties.find(
				(property): property is AST.JsxAttribute =>
					property.kind === SyntaxKind.JsxAttribute &&
					property.name.kind === SyntaxKind.Identifier,
			);

			if (
				!roleProperty?.initializer ||
				roleProperty.initializer.kind !== SyntaxKind.StringLiteral
			) {
				return;
			}

			const role = roleProperty.initializer.text.trim();

			if (!role || !validAriaRoles.has(role)) {
				context.report({
					data: { role: role || "(empty)" },
					message: "invalidRole",
					range: getTSNodeRange(roleProperty, sourceFile),
				});
			}
		}

		return {
			visitors: {
				JsxOpeningElement: checkRole,
				JsxSelfClosingElement: checkRole,
			},
		};
	},
});
