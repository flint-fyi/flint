import { type AST, getTSNodeRange, typescriptLanguage } from "@flint.fyi/ts";
import { SyntaxKind } from "typescript";

export default typescriptLanguage.createRule({
	about: {
		description: "Reports positive tabIndex values.",
		id: "tabIndexPositiveValues",
		preset: "logical",
	},
	messages: {
		noPositiveTabIndex: {
			primary:
				"Positive `tabIndex` values disrupt tab order and make keyboard navigation unpredictable.",
			secondary: [
				"Injecting elements on top of the default tab order with positive `tabIndex` values changes from the intuitive order for users.",
				'Use tabIndex="0" to include elements in the natural tab order, or tabIndex="-1" to make them programmatically focusable.',
				"This is required for WCAG 2.4.3 compliance.",
			],
			suggestions: [
				'Use tabIndex="0" for elements that should be in the tab order',
				'Use tabIndex="-1" for elements that should be programmatically focusable',
				"Remove tabIndex to use the default tab order",
			],
		},
	},
	setup(context) {
		return {
			visitors: {
				JsxAttribute(node, { sourceFile }) {
					if (
						node.name.kind !== SyntaxKind.Identifier ||
						node.name.text.toLowerCase() !== "tabindex" ||
						!node.initializer
					) {
						return;
					}

					const value = getInitializerValue(node.initializer);

					if (value !== undefined && value > 0) {
						context.report({
							message: "noPositiveTabIndex",
							range: getTSNodeRange(node, sourceFile),
						});
					}
				},
			},
		};
	},
});

function getInitializerValue(initializer: AST.JsxAttributeValue) {
	if (initializer.kind === SyntaxKind.StringLiteral) {
		const parsed = Number(initializer.text);

		return isNaN(parsed) ? undefined : parsed;
	}

	if (initializer.kind === SyntaxKind.JsxExpression) {
		return initializer.expression &&
			initializer.expression.kind === SyntaxKind.NumericLiteral
			? Number(initializer.expression.text)
			: undefined;
	}

	return undefined;
}
