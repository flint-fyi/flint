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
	"span",
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

export default typescriptLanguage.createRule({
	about: {
		description:
			"Reports non-interactive elements with positive or zero tabIndex values.",
		id: "nonInteractiveElementTabIndexes",
		preset: "logical",
	},
	messages: {
		nonInteractiveTabIndex: {
			primary:
				"Non-interactive element `<{{ element }}>` should not have an explicit, non-negative `tabIndex`.",
			secondary: [
				"Tab navigation should be limited to interactive elements.",
				"Non-interactive elements with tabIndex add unnecessary stops in the tab order.",
				"Use tabIndex='-1' if you need to programmatically focus the element.",
			],
			suggestions: [
				"Remove the tabIndex attribute",
				"Use tabIndex='-1' instead",
				"Add an interactive role to the element",
			],
		},
	},
	setup(context) {
		function getTabIndexValue(attr: AST.JsxAttribute) {
			if (!attr.initializer) {
				return undefined;
			}

			if (attr.initializer.kind === SyntaxKind.StringLiteral) {
				const value = parseInt(attr.initializer.text, 10);
				return isNaN(value) ? undefined : value;
			}

			if (attr.initializer.kind === SyntaxKind.JsxExpression) {
				const expr = attr.initializer.expression;
				if (expr && expr.kind === SyntaxKind.NumericLiteral) {
					const value = parseInt(expr.text, 10);
					return isNaN(value) ? undefined : value;
				}
			}

			return undefined;
		}

		function getRoleValue(attributes: AST.JsxAttributes) {
			const roleProperty = attributes.properties.find(
				(property) =>
					property.kind === SyntaxKind.JsxAttribute &&
					property.name.kind === SyntaxKind.Identifier &&
					property.name.text === "role",
			);

			if (
				roleProperty &&
				roleProperty.kind === SyntaxKind.JsxAttribute &&
				roleProperty.initializer &&
				roleProperty.initializer.kind === SyntaxKind.StringLiteral
			) {
				return roleProperty.initializer.text;
			}

			return undefined;
		}

		function checkTabIndex(
			node: AST.JsxOpeningElement | AST.JsxSelfClosingElement,
			{ sourceFile }: TypeScriptFileServices,
		) {
			if (node.tagName.kind !== SyntaxKind.Identifier) {
				return;
			}

			const elementName = node.tagName.text.toLowerCase();

			if (!nonInteractiveElements.has(elementName)) {
				return;
			}

			const role = getRoleValue(node.attributes);
			if (role && interactiveRoles.has(role)) {
				return;
			}

			const tabIndexProperty = node.attributes.properties.find(
				(property) =>
					property.kind === SyntaxKind.JsxAttribute &&
					property.name.kind === SyntaxKind.Identifier &&
					property.name.text === "tabIndex",
			);

			if (
				!tabIndexProperty ||
				tabIndexProperty.kind !== SyntaxKind.JsxAttribute
			) {
				return;
			}

			const tabIndexValue = getTabIndexValue(tabIndexProperty);

			if (tabIndexValue !== undefined && tabIndexValue >= 0) {
				context.report({
					data: { element: elementName },
					message: "nonInteractiveTabIndex",
					range: getTSNodeRange(tabIndexProperty, sourceFile),
				});
			}
		}

		return {
			visitors: {
				JsxOpeningElement: checkTabIndex,
				JsxSelfClosingElement: checkTabIndex,
			},
		};
	},
});
