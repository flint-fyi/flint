import {
	type AST,
	getTSNodeRange,
	type TypeScriptFileServices,
	typescriptLanguage,
} from "@flint.fyi/ts";
import { SyntaxKind } from "typescript";

const roleToElement: Record<string, string> = {
	article: "article",
	banner: "header",
	button: "button",
	checkbox: "input[type='checkbox']",
	complementary: "aside",
	contentinfo: "footer",
	definition: "dd",
	dialog: "dialog",
	figure: "figure",
	form: "form",
	heading: "h1-h6",
	img: "img",
	link: "a",
	list: "ul/ol",
	listitem: "li",
	main: "main",
	navigation: "nav",
	radio: "input[type='radio']",
	region: "section",
	row: "tr",
	rowgroup: "tbody/tfoot/thead",
	table: "table",
	term: "dt",
	textbox: "input[type='text']/textarea",
};

export default typescriptLanguage.createRule({
	about: {
		description:
			"Reports ARIA roles that have semantic HTML element equivalents.",
		id: "roleTags",
		preset: "logical",
	},
	messages: {
		preferSemanticElement: {
			primary:
				"<{{ currentElement }}> with role='{{ role }}' is a less-accessible equivalent to <{{ semanticElement }}>.",
			secondary: [
				"Semantic HTML elements have built-in accessibility features.",
				"Using native elements is more maintainable than ARIA roles.",
				"Browsers provide better default behavior for semantic elements.",
			],
			suggestions: ["Replace with the semantic HTML element"],
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
			const semanticElement = roleToElement[role];

			if (semanticElement) {
				context.report({
					data: {
						currentElement: node.tagName.text,
						role,
						semanticElement,
					},
					message: "preferSemanticElement",
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
