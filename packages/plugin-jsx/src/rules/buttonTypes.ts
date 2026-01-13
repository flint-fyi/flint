import {
	type AST,
	getTSNodeRange,
	type TypeScriptFileServices,
	typescriptLanguage,
} from "@flint.fyi/ts";
import { SyntaxKind } from "typescript";

const validButtonTypes = new Set(["button", "reset", "submit"]);

export default typescriptLanguage.createRule({
	about: {
		description: "Reports button elements without an explicit type attribute.",
		id: "buttonTypes",
		preset: "logical",
	},
	messages: {
		invalidType: {
			primary:
				"Button type '{{ type }}' is invalid. Use 'button', 'submit', or 'reset'.",
			secondary: [
				"The type attribute must be one of: 'button', 'submit', or 'reset'.",
				"Invalid types will not behave as expected in all browsers.",
			],
			suggestions: [
				"Change to type='button' for general action buttons",
				"Change to type='submit' for form submission buttons",
				"Change to type='reset' for form reset buttons",
			],
		},
		missingType: {
			primary:
				"It is generally preferable to add an explicit `type` attribute to buttons.",
			secondary: [
				"Buttons without an explicit type default to 'submit', which can cause unintended form submissions.",
				"Valid button types are 'button', 'submit', and 'reset'.",
				"Specify an explicit type to make the button's behavior clear.",
			],
			suggestions: [
				"Add type='button' for general action buttons",
				"Add type='submit' for form submission buttons",
				"Add type='reset' for form reset buttons",
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
			if (elementName !== "button") {
				return;
			}

			const typeAttribute = node.attributes.properties.find(
				(property): property is AST.JsxAttribute =>
					property.kind === SyntaxKind.JsxAttribute &&
					property.name.kind === SyntaxKind.Identifier &&
					property.name.text.toLowerCase() === "type",
			);

			if (!typeAttribute) {
				context.report({
					message: "missingType",
					range: getTSNodeRange(node.tagName, sourceFile),
				});
				return;
			}

			const typeValue = getTypeValue(typeAttribute);

			if (typeValue && !validButtonTypes.has(typeValue)) {
				context.report({
					data: { type: typeValue },
					message: "invalidType",
					range: getTSNodeRange(typeAttribute, sourceFile),
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

// TODO: Use a util like getStaticValue
// https://github.com/flint-fyi/flint/issues/1298
function getTypeValue(attribute: AST.JsxAttribute): string | undefined {
	if (!attribute.initializer) {
		return undefined;
	}

	if (attribute.initializer.kind === SyntaxKind.StringLiteral) {
		return attribute.initializer.text;
	}

	if (attribute.initializer.kind === SyntaxKind.JsxExpression) {
		const expr = attribute.initializer.expression;
		if (expr && expr.kind === SyntaxKind.StringLiteral) {
			return expr.text;
		}
	}

	return undefined;
}
