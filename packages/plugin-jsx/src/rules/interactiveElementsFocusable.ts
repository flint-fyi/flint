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

const interactiveRoles = new Set([
	"button",
	"checkbox",
	"columnheader",
	"combobox",
	"grid",
	"gridcell",
	"link",
	"listbox",
	"menu",
	"menubar",
	"menuitem",
	"menuitemcheckbox",
	"menuitemradio",
	"option",
	"progressbar",
	"radio",
	"radiogroup",
	"row",
	"rowheader",
	"searchbox",
	"slider",
	"spinbutton",
	"switch",
	"tab",
	"tablist",
	"textbox",
	"toolbar",
	"tree",
	"treegrid",
	"treeitem",
]);

const inherentlyFocusableElements = new Set([
	"a",
	"audio",
	"button",
	"input",
	"select",
	"textarea",
	"video",
]);

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
	"table",
	"td",
	"ul",
]);

const nonInteractiveRoles = new Set([
	"article",
	"banner",
	"complementary",
	"img",
	"listitem",
	"main",
	"navigation",
	"region",
	"tooltip",
]);

export default typescriptLanguage.createRule({
	about: {
		description:
			"Reports interactive elements that are not focusable via keyboard.",
		id: "interactiveElementsFocusable",
		preset: "logical",
	},
	messages: {
		notFocusable: {
			primary:
				"The '{{ role }}' role makes this element interactive, so it should also be focusable.",
			secondary: [
				"Interactive elements must be reachable via keyboard navigation.",
				"Add a tabIndex attribute or use an inherently focusable element.",
				"This is required for WCAG 2.1.1 compliance.",
			],
			suggestions: [
				"Add tabIndex={0} to make the element tabbable",
				"Add tabIndex={-1} to make the element programmatically focusable",
				"Use a native interactive element like <button> or <a>",
			],
		},
	},
	setup(context) {
		function getTabIndexValue(
			node: AST.JsxOpeningElement | AST.JsxSelfClosingElement,
		) {
			const tabIndex = node.attributes.properties.find(
				(property): property is AST.JsxAttribute =>
					property.kind === SyntaxKind.JsxAttribute &&
					property.name.kind === SyntaxKind.Identifier &&
					property.name.text === "tabIndex",
			);

			if (!tabIndex?.initializer) {
				return undefined;
			}

			if (tabIndex.initializer.kind === SyntaxKind.JsxExpression) {
				const expression = tabIndex.initializer.expression;
				if (expression && expression.kind === SyntaxKind.NumericLiteral) {
					return Number(expression.text);
				}
			}

			if (tabIndex.initializer.kind === SyntaxKind.StringLiteral) {
				return Number(tabIndex.initializer.text);
			}

			return undefined;
		}

		function getRoleValue(
			node: AST.JsxOpeningElement | AST.JsxSelfClosingElement,
		) {
			const role = node.attributes.properties.find(
				(property) =>
					property.kind === SyntaxKind.JsxAttribute &&
					property.name.kind === SyntaxKind.Identifier &&
					property.name.text === "role",
			);

			if (
				role &&
				role.kind === SyntaxKind.JsxAttribute &&
				role.initializer &&
				role.initializer.kind === SyntaxKind.StringLiteral
			) {
				return role.initializer.text;
			}

			return undefined;
		}

		function isAriaHidden(
			node: AST.JsxOpeningElement | AST.JsxSelfClosingElement,
		) {
			const ariaHidden = node.attributes.properties.find(
				(property) =>
					property.kind === SyntaxKind.JsxAttribute &&
					property.name.kind === SyntaxKind.Identifier &&
					property.name.text === "aria-hidden",
			);

			if (
				!ariaHidden ||
				ariaHidden.kind !== SyntaxKind.JsxAttribute ||
				!ariaHidden.initializer
			) {
				return false;
			}

			if (ariaHidden.initializer.kind === SyntaxKind.JsxExpression) {
				return (
					ariaHidden.initializer.expression?.kind === SyntaxKind.TrueKeyword
				);
			}

			if (ariaHidden.initializer.kind === SyntaxKind.StringLiteral) {
				return ariaHidden.initializer.text === "true";
			}

			return false;
		}

		function hasInteractiveHandler(
			node: AST.JsxOpeningElement | AST.JsxSelfClosingElement,
		) {
			return node.attributes.properties.some(
				(property) =>
					property.kind === SyntaxKind.JsxAttribute &&
					property.name.kind === SyntaxKind.Identifier &&
					interactiveHandlers.includes(property.name.text),
			);
		}

		function isDisabled(
			node: AST.JsxOpeningElement | AST.JsxSelfClosingElement,
		) {
			const disabledProperty = node.attributes.properties.find(
				(property) =>
					property.kind === SyntaxKind.JsxAttribute &&
					property.name.kind === SyntaxKind.Identifier &&
					property.name.text === "disabled",
			);

			if (
				!disabledProperty ||
				disabledProperty.kind !== SyntaxKind.JsxAttribute
			) {
				return false;
			}

			if (!disabledProperty.initializer) {
				return true;
			}

			if (disabledProperty.initializer.kind === SyntaxKind.JsxExpression) {
				return (
					disabledProperty.initializer.expression?.kind ===
					SyntaxKind.TrueKeyword
				);
			}

			return false;
		}

		function checkElement(
			node: AST.JsxOpeningElement | AST.JsxSelfClosingElement,
			{ sourceFile }: TypeScriptFileServices,
		) {
			if (node.tagName.kind !== SyntaxKind.Identifier) {
				return;
			}

			const elementName = node.tagName.text.toLowerCase();
			if (
				elementName !== node.tagName.text ||
				!hasInteractiveHandler(node) ||
				isAriaHidden(node) ||
				isDisabled(node)
			) {
				return;
			}

			const role = getRoleValue(node);
			if (role === "presentation" || role === "none") {
				return;
			}

			const isInteractive =
				(role !== undefined && interactiveRoles.has(role)) ||
				(role === undefined && !nonInteractiveElements.has(elementName));

			if (!isInteractive) {
				return;
			}

			const hasNonInteractiveRole = role && nonInteractiveRoles.has(role);
			if (hasNonInteractiveRole) {
				return;
			}

			const hasInherentFocus = inherentlyFocusableElements.has(elementName);
			const tabIndex = getTabIndexValue(node);
			const hasFocusableTabIndex = tabIndex !== undefined;
			const roleProperty = node.attributes.properties.find(
				(property) =>
					property.kind === SyntaxKind.JsxAttribute &&
					property.name.kind === SyntaxKind.Identifier &&
					property.name.text === "role",
			);

			if (!hasInherentFocus && !hasFocusableTabIndex) {
				const displayRole = role ?? elementName;
				context.report({
					data: { role: displayRole },
					message: "notFocusable",
					range: getTSNodeRange(
						roleProperty && roleProperty.kind === SyntaxKind.JsxAttribute
							? roleProperty
							: node.tagName,
						sourceFile,
					),
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
