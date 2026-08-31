import {
	isIdentifier,
	isJsxAttribute,
	isJsxExpression,
	isNumericLiteral,
	isStringLiteral,
	SyntaxKind,
} from "typescript-native/unstable/ast";

import {
	getTSNodeRange,
	typescriptLanguage,
	type AST,
	type TypeScriptFileServices,
} from "@flint.fyi/typescript-language";

import { ruleCreator } from "./ruleCreator.ts";

const focusableElements = new Set([
	"a",
	"audio",
	"button",
	"input",
	"select",
	"textarea",
	"video",
]);

export default ruleCreator.createRule(typescriptLanguage, {
	about: {
		description: "Reports elements with aria-hidden='true' that are focusable.",
		id: "ariaHiddenFocusables",
		presets: ["logical", "logicalStrict"],
	},
	messages: {
		ariaHiddenFocusable: {
			primary:
				'This element has `aria-hidden="true"` but is focusable, which is misleading to users navigating with keyboards.',
			secondary: [
				"Elements with aria-hidden='true' should not be reachable via keyboard navigation.",
				"This creates confusion when users can focus elements they cannot perceive with a screen reader.",
			],
			suggestions: [
				'Remove aria-hidden="true"',
				'Add tabIndex="-1" to remove from focus order',
				"Use a non-focusable element",
			],
		},
	},
	setup(context) {
		function checkElement(
			node: AST.JsxOpeningElement | AST.JsxSelfClosingElement,
			{ sourceFile }: TypeScriptFileServices,
		) {
			const { attributes, tagName } = node;
			if (!isIdentifier(tagName)) {
				return;
			}

			const ariaHiddenProperty = attributes.properties.find(
				(property) =>
					isJsxAttribute(property) &&
					isIdentifier(property.name) &&
					property.name.text.toLowerCase() === "aria-hidden",
			);

			if (
				!ariaHiddenProperty ||
				!isJsxAttribute(ariaHiddenProperty) ||
				!isAriaHiddenTrue(ariaHiddenProperty)
			) {
				return;
			}

			const tabIndexValue = findTabIndexValue(node);
			if (tabIndexValue === -1) {
				return;
			}

			if (
				focusableElements.has(tagName.text.toLowerCase()) ||
				(tabIndexValue !== undefined && tabIndexValue >= 0)
			) {
				context.report({
					message: "ariaHiddenFocusable",
					range: getTSNodeRange(ariaHiddenProperty, sourceFile),
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

function findTabIndexValue(
	node: AST.JsxOpeningElement | AST.JsxSelfClosingElement,
) {
	const tabIndexProperty = node.attributes.properties.find(
		(property): property is AST.JsxAttribute =>
			isJsxAttribute(property) &&
			isIdentifier(property.name) &&
			property.name.text.toLowerCase() === "tabindex",
	);

	if (!tabIndexProperty?.initializer) {
		return undefined;
	}

	if (isJsxExpression(tabIndexProperty.initializer)) {
		const expression = tabIndexProperty.initializer.expression;
		if (expression && isNumericLiteral(expression)) {
			return Number(expression.text);
		}
	}

	if (isStringLiteral(tabIndexProperty.initializer)) {
		return Number(tabIndexProperty.initializer.text);
	}

	return undefined;
}

function isAriaHiddenTrue(ariaHiddenProperty: AST.JsxAttribute) {
	if (!ariaHiddenProperty.initializer) {
		return false;
	}

	if (isStringLiteral(ariaHiddenProperty.initializer)) {
		return ariaHiddenProperty.initializer.text === "true";
	}

	if (isJsxExpression(ariaHiddenProperty.initializer)) {
		const expression = ariaHiddenProperty.initializer.expression;
		if (expression?.kind === SyntaxKind.TrueKeyword) {
			return true;
		}
	}

	return false;
}
