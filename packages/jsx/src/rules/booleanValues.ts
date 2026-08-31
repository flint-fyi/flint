import {
	isIdentifier,
	isJsxAttribute,
	isJsxExpression,
	SyntaxKind,
} from "typescript-native/unstable/ast";

import {
	getTSNodeRange,
	typescriptLanguage,
	type AST,
	type TypeScriptFileServices,
} from "@flint.fyi/typescript-language";

import { ruleCreator } from "./ruleCreator.ts";

export default ruleCreator.createRule(typescriptLanguage, {
	about: {
		description:
			"Prefer shorthand boolean attributes over explicit {true} values in JSX.",
		id: "booleanValues",
		presets: ["stylistic"],
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
					isJsxAttribute(property) &&
					isIdentifier(property.name) &&
					property.initializer &&
					isJsxExpression(property.initializer) &&
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
