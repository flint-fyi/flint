import {
	type AST,
	getTSNodeRange,
	type TypeScriptFileServices,
	typescriptLanguage,
} from "@flint.fyi/ts";
import { nullThrows } from "@flint.fyi/utils";
import { SyntaxKind } from "typescript";

const validAutocompleteValues = new Set([
	"address-level1",
	"address-level2",
	"address-level3",
	"address-level4",
	"address-line1",
	"address-line2",
	"address-line3",
	"bday",
	"bday-day",
	"bday-month",
	"bday-year",
	"cc-additional-name",
	"cc-csc",
	"cc-exp",
	"cc-exp-month",
	"cc-exp-year",
	"cc-family-name",
	"cc-given-name",
	"cc-name",
	"cc-number",
	"cc-type",
	"country",
	"country-name",
	"current-password",
	"email",
	"impp",
	"language",
	"name",
	"new-password",
	"off",
	"on",
	"one-time-code",
	"organization",
	"organization-title",
	"photo",
	"postal-code",
	"sex",
	"street-address",
	"tel",
	"tel-area-code",
	"tel-country-code",
	"tel-extension",
	"tel-local",
	"tel-national",
	"transaction-amount",
	"transaction-currency",
	"url",
	"username",
	"webauthn",
]);

const billingAndShippingValues = new Set([
	"address-level1",
	"address-level2",
	"address-level3",
	"address-level4",
	"address-line1",
	"address-line2",
	"address-line3",
	"country",
	"country-name",
	"postal-code",
	"street-address",
]);

function isValidAutocompleteValue(value: string): boolean {
	const parts = value.trim().split(/\s+/);

	if (parts.length === 1) {
		return validAutocompleteValues.has(
			nullThrows(
				parts[0],
				"First part is expected to be present by prior length check",
			),
		);
	}

	if (parts.length === 2) {
		const [prefix, token] = parts;
		if (prefix === "billing" || prefix === "shipping") {
			return billingAndShippingValues.has(
				nullThrows(
					token,
					"Second part is expected to be present by prior length check",
				),
			);
		}
	}

	return false;
}

export default typescriptLanguage.createRule({
	about: {
		description:
			"Ensure the autocomplete attribute is correct and suitable for the form field.",
		id: "autocomplete",
		preset: "logical",
	},
	messages: {
		invalid: {
			primary: "`{{ value }}` is not a valid value for autocomplete.",
			secondary: [
				"The autocomplete attribute must use valid tokens from the HTML specification.",
				"Valid values help browsers and assistive technologies provide better user experiences.",
				"This is required for WCAG 1.3.5 compliance.",
			],
			suggestions: [
				"Use standard autocomplete tokens like 'email', 'name', 'off', or 'tel'",
				"For address fields, use 'billing' or 'shipping' prefix with appropriate field tokens",
				"Check the HTML specification for the complete list of valid autocomplete tokens",
			],
		},
	},
	setup(context) {
		function checkNode(
			node: AST.JsxOpeningElement | AST.JsxSelfClosingElement,
			{ sourceFile }: TypeScriptFileServices,
		) {
			const { attributes, tagName } = node;
			if (tagName.kind !== SyntaxKind.Identifier) {
				return;
			}

			const elementName = tagName.text.toLowerCase();
			if (elementName !== "input") {
				return;
			}

			const autocomplete = attributes.properties.find(
				(property) =>
					property.kind === SyntaxKind.JsxAttribute &&
					property.name.kind === SyntaxKind.Identifier &&
					property.name.text.toLowerCase() === "autocomplete",
			);

			if (
				!autocomplete ||
				autocomplete.kind !== SyntaxKind.JsxAttribute ||
				!autocomplete.initializer
			) {
				return;
			}

			const value = getStringLiteralValue(autocomplete.initializer);
			if (value === undefined || isValidAutocompleteValue(value)) {
				return;
			}

			context.report({
				data: { value },
				message: "invalid",
				range: getTSNodeRange(autocomplete.name, sourceFile),
			});
		}

		return {
			visitors: {
				JsxOpeningElement: checkNode,
				JsxSelfClosingElement: checkNode,
			},
		};
	},
});

// TODO: Use a util like getStaticValue
// https://github.com/flint-fyi/flint/issues/1298
function getStringLiteralValue(node: AST.Expression): string | undefined {
	if (node.kind === SyntaxKind.StringLiteral) {
		return node.text;
	}

	if (
		node.kind === SyntaxKind.NoSubstitutionTemplateLiteral &&
		node.parent.kind !== SyntaxKind.TaggedTemplateExpression
	) {
		return node.text;
	}

	return undefined;
}
