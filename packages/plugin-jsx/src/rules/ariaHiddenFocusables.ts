import {
	type AST,
	getTSNodeRange,
	type TypeScriptFileServices,
	typescriptLanguage,
} from "@flint.fyi/ts";
import { SyntaxKind } from "typescript";

const focusableElements = new Set([
	"a",
	"audio",
	"button",
	"input",
	"select",
	"textarea",
	"video",
]);

export default typescriptLanguage.createRule({
	about: {
		description: "Reports elements with aria-hidden='true' that are focusable.",
		id: "ariaHiddenFocusables",
		preset: "logical",
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
			if (tagName.kind !== SyntaxKind.Identifier) {
				return;
			}

			const ariaHiddenProperty = attributes.properties.find(
				(property) =>
					property.kind === SyntaxKind.JsxAttribute &&
					property.name.kind === SyntaxKind.Identifier &&
					property.name.text.toLowerCase() === "aria-hidden",
			);

			if (
				!ariaHiddenProperty ||
				ariaHiddenProperty.kind !== SyntaxKind.JsxAttribute ||
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
			property.kind == SyntaxKind.JsxAttribute &&
			property.name.kind == SyntaxKind.Identifier &&
			property.name.text.toLowerCase() === "tabindex",
	);

	if (!tabIndexProperty?.initializer) {
		return undefined;
	}

	if (tabIndexProperty.initializer.kind == SyntaxKind.JsxExpression) {
		const expression = tabIndexProperty.initializer.expression;
		if (expression && expression.kind == SyntaxKind.NumericLiteral) {
			return Number(expression.text);
		}
	}

	if (tabIndexProperty.initializer.kind == SyntaxKind.StringLiteral) {
		return Number(tabIndexProperty.initializer.text);
	}

	return undefined;
}

function isAriaHiddenTrue(ariaHiddenProperty: AST.JsxAttribute) {
	if (!ariaHiddenProperty.initializer) {
		return false;
	}

	if (ariaHiddenProperty.initializer.kind === SyntaxKind.StringLiteral) {
		return ariaHiddenProperty.initializer.text === "true";
	}

	if (ariaHiddenProperty.initializer.kind === SyntaxKind.JsxExpression) {
		const expression = ariaHiddenProperty.initializer.expression;
		if (expression && expression.kind === SyntaxKind.TrueKeyword) {
			return true;
		}
	}

	return false;
}
