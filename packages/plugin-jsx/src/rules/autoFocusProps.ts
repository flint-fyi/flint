import {
	type AST,
	getTSNodeRange,
	type TypeScriptFileServices,
	typescriptLanguage,
} from "@flint.fyi/ts";
import { SyntaxKind } from "typescript";

export default typescriptLanguage.createRule({
	about: {
		description: "Reports autoFocus props that are not set to false.",
		id: "autoFocusProps",
		preset: "logical",
	},
	messages: {
		noAutoFocus: {
			primary:
				"The `autoFocus` prop disruptively forces unintuitive focus behavior.",
			secondary: [
				"Auto-focusing elements can cause usability issues for sighted and non-sighted users.",
				"It can be disruptive to users who rely on screen readers or keyboard navigation.",
				"Consider letting users focus elements manually instead.",
			],
			suggestions: [
				"Remove the autoFocus prop",
				"Set autoFocus to false: autoFocus={false}",
			],
		},
	},
	setup(context) {
		function isSetToFalse(property: AST.JsxAttribute) {
			if (!property.initializer) {
				return false;
			}

			if (property.initializer.kind === SyntaxKind.StringLiteral) {
				return property.initializer.text === "false";
			}

			if (property.initializer.kind === SyntaxKind.JsxExpression) {
				const expr = property.initializer.expression;
				if (expr && expr.kind === SyntaxKind.FalseKeyword) {
					return true;
				}
			}

			return false;
		}

		function checkElement(
			node: AST.JsxOpeningElement | AST.JsxSelfClosingElement,
			{ sourceFile }: TypeScriptFileServices,
		) {
			for (const property of node.attributes.properties) {
				if (
					property.kind === SyntaxKind.JsxAttribute &&
					property.name.kind === SyntaxKind.Identifier &&
					property.name.text.toLowerCase() === "autofocus" &&
					!isSetToFalse(property)
				) {
					context.report({
						message: "noAutoFocus",
						range: getTSNodeRange(property, sourceFile),
					});
				}
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
