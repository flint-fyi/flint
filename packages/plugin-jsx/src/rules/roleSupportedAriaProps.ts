import {
	type AST,
	getTSNodeRange,
	type TypeScriptFileServices,
	typescriptLanguage,
} from "@flint.fyi/ts";
import { SyntaxKind } from "typescript";

const globalAriaProperties = new Set([
	"aria-atomic",
	"aria-busy",
	"aria-controls",
	"aria-current",
	"aria-describedby",
	"aria-details",
	"aria-disabled",
	"aria-dropeffect",
	"aria-errormessage",
	"aria-flowto",
	"aria-grabbed",
	"aria-haspopup",
	"aria-hidden",
	"aria-invalid",
	"aria-keyshortcuts",
	"aria-label",
	"aria-labelledby",
	"aria-live",
	"aria-owns",
	"aria-relevant",
	"aria-roledescription",
]);

const roleToSupportedProps: Partial<Record<string, Set<string>>> = {
	alert: new Set(["aria-expanded"]),
	alertdialog: new Set(["aria-expanded", "aria-modal"]),
	application: new Set(["aria-activedescendant", "aria-expanded"]),
	article: new Set(["aria-expanded", "aria-posinset", "aria-setsize"]),
	banner: new Set(["aria-expanded"]),
	button: new Set(["aria-expanded", "aria-pressed"]),
	cell: new Set([
		"aria-colindex",
		"aria-colspan",
		"aria-expanded",
		"aria-rowindex",
		"aria-rowspan",
	]),
	checkbox: new Set([
		"aria-checked",
		"aria-expanded",
		"aria-readonly",
		"aria-required",
	]),
	columnheader: new Set([
		"aria-colindex",
		"aria-colspan",
		"aria-expanded",
		"aria-readonly",
		"aria-required",
		"aria-rowindex",
		"aria-rowspan",
		"aria-selected",
		"aria-sort",
	]),
	combobox: new Set([
		"aria-activedescendant",
		"aria-autocomplete",
		"aria-expanded",
		"aria-readonly",
		"aria-required",
	]),
	command: new Set(["aria-expanded"]),
	complementary: new Set(["aria-expanded"]),
	composite: new Set(["aria-activedescendant", "aria-expanded"]),
	contentinfo: new Set(["aria-expanded"]),
	definition: new Set(["aria-expanded"]),
	dialog: new Set(["aria-expanded", "aria-modal"]),
	directory: new Set(["aria-expanded"]),
	document: new Set(["aria-expanded"]),
	feed: new Set(["aria-expanded"]),
	figure: new Set(["aria-expanded"]),
	form: new Set(["aria-expanded"]),
	grid: new Set([
		"aria-activedescendant",
		"aria-colcount",
		"aria-expanded",
		"aria-level",
		"aria-multiselectable",
		"aria-readonly",
		"aria-rowcount",
	]),
	gridcell: new Set([
		"aria-colindex",
		"aria-colspan",
		"aria-expanded",
		"aria-readonly",
		"aria-required",
		"aria-rowindex",
		"aria-rowspan",
		"aria-selected",
	]),
	group: new Set(["aria-activedescendant", "aria-expanded"]),
	heading: new Set(["aria-expanded", "aria-level"]),
	img: new Set(["aria-expanded"]),
	input: new Set(["aria-expanded"]),
	landmark: new Set(["aria-expanded"]),
	link: new Set(["aria-expanded"]),
	list: new Set(["aria-expanded"]),
	listbox: new Set([
		"aria-activedescendant",
		"aria-expanded",
		"aria-multiselectable",
		"aria-orientation",
		"aria-readonly",
		"aria-required",
	]),
	listitem: new Set([
		"aria-expanded",
		"aria-level",
		"aria-posinset",
		"aria-setsize",
	]),
	log: new Set(["aria-expanded"]),
	main: new Set(["aria-expanded"]),
	marquee: new Set(["aria-expanded"]),
	math: new Set(["aria-expanded"]),
	menu: new Set(["aria-activedescendant", "aria-expanded", "aria-orientation"]),
	menubar: new Set([
		"aria-activedescendant",
		"aria-expanded",
		"aria-orientation",
	]),
	menuitem: new Set(["aria-expanded", "aria-posinset", "aria-setsize"]),
	menuitemcheckbox: new Set([
		"aria-checked",
		"aria-expanded",
		"aria-posinset",
		"aria-readonly",
		"aria-setsize",
	]),
	menuitemradio: new Set([
		"aria-checked",
		"aria-expanded",
		"aria-posinset",
		"aria-readonly",
		"aria-setsize",
	]),
	navigation: new Set(["aria-expanded"]),
	none: new Set([]),
	note: new Set(["aria-expanded"]),
	option: new Set([
		"aria-checked",
		"aria-expanded",
		"aria-posinset",
		"aria-selected",
		"aria-setsize",
	]),
	presentation: new Set([]),
	progressbar: new Set([
		"aria-expanded",
		"aria-valuemax",
		"aria-valuemin",
		"aria-valuenow",
		"aria-valuetext",
	]),
	radio: new Set([
		"aria-checked",
		"aria-expanded",
		"aria-posinset",
		"aria-readonly",
		"aria-setsize",
	]),
	radiogroup: new Set([
		"aria-activedescendant",
		"aria-expanded",
		"aria-orientation",
		"aria-readonly",
		"aria-required",
	]),
	range: new Set([
		"aria-expanded",
		"aria-valuemax",
		"aria-valuemin",
		"aria-valuenow",
		"aria-valuetext",
	]),
	region: new Set(["aria-expanded"]),
	roletype: new Set(["aria-expanded"]),
	row: new Set([
		"aria-activedescendant",
		"aria-colindex",
		"aria-expanded",
		"aria-level",
		"aria-rowindex",
		"aria-selected",
	]),
	rowgroup: new Set(["aria-activedescendant", "aria-expanded"]),
	rowheader: new Set([
		"aria-colindex",
		"aria-colspan",
		"aria-expanded",
		"aria-readonly",
		"aria-required",
		"aria-rowindex",
		"aria-rowspan",
		"aria-selected",
		"aria-sort",
	]),
	scrollbar: new Set([
		"aria-controls",
		"aria-expanded",
		"aria-orientation",
		"aria-valuemax",
		"aria-valuemin",
		"aria-valuenow",
		"aria-valuetext",
	]),
	search: new Set(["aria-expanded"]),
	searchbox: new Set([
		"aria-activedescendant",
		"aria-autocomplete",
		"aria-expanded",
		"aria-multiline",
		"aria-placeholder",
		"aria-readonly",
		"aria-required",
	]),
	section: new Set(["aria-expanded"]),
	sectionhead: new Set(["aria-expanded"]),
	select: new Set([
		"aria-activedescendant",
		"aria-expanded",
		"aria-orientation",
	]),
	separator: new Set([
		"aria-expanded",
		"aria-orientation",
		"aria-valuemax",
		"aria-valuemin",
		"aria-valuenow",
		"aria-valuetext",
	]),
	slider: new Set([
		"aria-expanded",
		"aria-orientation",
		"aria-readonly",
		"aria-valuemax",
		"aria-valuemin",
		"aria-valuenow",
		"aria-valuetext",
	]),
	spinbutton: new Set([
		"aria-activedescendant",
		"aria-expanded",
		"aria-readonly",
		"aria-required",
		"aria-valuemax",
		"aria-valuemin",
		"aria-valuenow",
		"aria-valuetext",
	]),
	status: new Set(["aria-expanded"]),
	structure: new Set(["aria-expanded"]),
	switch: new Set([
		"aria-checked",
		"aria-expanded",
		"aria-readonly",
		"aria-required",
	]),
	tab: new Set([
		"aria-expanded",
		"aria-posinset",
		"aria-selected",
		"aria-setsize",
	]),
	table: new Set([
		"aria-colcount",
		"aria-expanded",
		"aria-level",
		"aria-multiselectable",
		"aria-rowcount",
	]),
	tablist: new Set([
		"aria-activedescendant",
		"aria-expanded",
		"aria-level",
		"aria-multiselectable",
		"aria-orientation",
	]),
	tabpanel: new Set(["aria-expanded"]),
	term: new Set(["aria-expanded"]),
	textbox: new Set([
		"aria-activedescendant",
		"aria-autocomplete",
		"aria-expanded",
		"aria-multiline",
		"aria-placeholder",
		"aria-readonly",
		"aria-required",
	]),
	timer: new Set(["aria-expanded"]),
	toolbar: new Set([
		"aria-activedescendant",
		"aria-expanded",
		"aria-orientation",
	]),
	tooltip: new Set(["aria-expanded"]),
	tree: new Set([
		"aria-activedescendant",
		"aria-expanded",
		"aria-multiselectable",
		"aria-orientation",
		"aria-required",
	]),
	treegrid: new Set([
		"aria-activedescendant",
		"aria-colcount",
		"aria-expanded",
		"aria-level",
		"aria-multiselectable",
		"aria-orientation",
		"aria-readonly",
		"aria-required",
		"aria-rowcount",
	]),
	treeitem: new Set([
		"aria-checked",
		"aria-expanded",
		"aria-level",
		"aria-posinset",
		"aria-selected",
		"aria-setsize",
	]),
	widget: new Set(["aria-expanded"]),
	window: new Set(["aria-expanded", "aria-modal"]),
};

const implicitRoles: Record<string, string> = {
	a: "link",
	article: "article",
	aside: "complementary",
	button: "button",
	dialog: "dialog",
	footer: "contentinfo",
	form: "form",
	h1: "heading",
	h2: "heading",
	h3: "heading",
	h4: "heading",
	h5: "heading",
	h6: "heading",
	header: "banner",
	hr: "separator",
	img: "img",
	input: "textbox",
	li: "listitem",
	main: "main",
	nav: "navigation",
	ol: "list",
	section: "region",
	select: "listbox",
	textarea: "textbox",
	ul: "list",
};

function getSupportedPropsForRole(role: string): Set<string> {
	return new Set([
		...(roleToSupportedProps[role] ?? []),
		...globalAriaProperties,
	]);
}

export default typescriptLanguage.createRule({
	about: {
		description:
			"Reports ARIA properties that are not supported by an element's role.",
		id: "roleSupportedAriaProps",
		preset: "logical",
	},
	messages: {
		unsupportedProp: {
			primary:
				"The `{{ prop }}` ARIA property is not supported by the `{{ role }}` role.",
			secondary: [
				"Elements with ARIA roles should only use ARIA properties that are supported by that role.",
				"Using unsupported ARIA properties can confuse assistive technologies.",
				"This is required for WCAG 4.1.2 compliance.",
			],
			suggestions: [
				"Remove the unsupported ARIA property or change the element's role.",
			],
		},
	},
	setup(context) {
		function checkElement(
			node: AST.JsxOpeningElement | AST.JsxSelfClosingElement,
			{ sourceFile }: TypeScriptFileServices,
		) {
			if (node.tagName.kind !== SyntaxKind.Identifier) {
				return;
			}

			const elementName = node.tagName.text.toLowerCase();

			const roleProperty = node.attributes.properties.find(
				(property) =>
					property.kind === SyntaxKind.JsxAttribute &&
					property.name.kind === SyntaxKind.Identifier &&
					property.name.text === "role",
			);

			const role =
				roleProperty &&
				roleProperty.kind === SyntaxKind.JsxAttribute &&
				roleProperty.initializer &&
				roleProperty.initializer.kind === SyntaxKind.StringLiteral
					? roleProperty.initializer.text.toLowerCase()
					: implicitRoles[elementName];

			if (!role) {
				return;
			}

			const supportedProps = getSupportedPropsForRole(role);

			for (const property of node.attributes.properties) {
				if (
					property.kind !== SyntaxKind.JsxAttribute ||
					property.name.kind !== SyntaxKind.Identifier
				) {
					continue;
				}

				const propertyName = property.name.text.toLowerCase();
				if (
					!propertyName.startsWith("aria-") ||
					supportedProps.has(propertyName)
				) {
					continue;
				}

				context.report({
					data: { prop: propertyName, role },
					message: "unsupportedProp",
					range: getTSNodeRange(property.name, sourceFile),
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
