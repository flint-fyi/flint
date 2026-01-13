import {
	type AST,
	getTSNodeRange,
	type TypeScriptFileServices,
	typescriptLanguage,
} from "@flint.fyi/ts";
import { SyntaxKind } from "typescript";

export default typescriptLanguage.createRule({
	about: {
		description:
			"Prefer shorthand boolean attributes over explicit {true} values in JSX.",
		id: "booleanValues",
		preset: "stylistic",
	},
	messages: {
		preferShorthand: {
			primary:
				"Prefer shorthand boolean attribute `{{ name }}` over explicit `{{ name }}={true}`.",
			secondary: [
				"Boolean attributes with explicit `{true}` values are redundant and verbose.",
				"The shorthand syntax is more concise and idiomatic in JSX.",
			],
			suggestions: ["Use the shorthand syntax: `{{ name }}`"],
		},
	},
	setup(context) {
		function checkElement(
			node: AST.JsxOpeningElement | AST.JsxSelfClosingElement,
			{ sourceFile }: TypeScriptFileServices,
		) {
			for (const property of node.attributes.properties) {
				if (
					property.kind === SyntaxKind.JsxAttribute &&
					property.name.kind === SyntaxKind.Identifier &&
					property.initializer &&
					property.initializer.kind === SyntaxKind.JsxExpression &&
					property.initializer.expression?.kind === SyntaxKind.TrueKeyword
				) {
					context.report({
						data: { name: property.name.text },
						message: "preferShorthand",
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
