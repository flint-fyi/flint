import {
	type AST,
	getTSNodeRange,
	type TypeScriptFileServices,
	typescriptLanguage,
} from "@flint.fyi/ts";
import { SyntaxKind } from "typescript";

type AriaPropertyType =
	| "boolean"
	| "id"
	| "idlist"
	| "integer"
	| "number"
	| "string"
	| "token"
	| "tristate";

const ariaPropertyTypes: Partial<Record<string, AriaPropertyType>> = {
	"aria-activedescendant": "id",
	"aria-atomic": "boolean",
	"aria-autocomplete": "token",
	"aria-busy": "boolean",
	"aria-checked": "tristate",
	"aria-colcount": "integer",
	"aria-colindex": "integer",
	"aria-colspan": "integer",
	"aria-controls": "idlist",
	"aria-current": "token",
	"aria-describedby": "idlist",
	"aria-details": "id",
	"aria-disabled": "boolean",
	"aria-dropeffect": "token",
	"aria-errormessage": "id",
	"aria-expanded": "tristate",
	"aria-flowto": "idlist",
	"aria-grabbed": "tristate",
	"aria-haspopup": "token",
	"aria-hidden": "tristate",
	"aria-invalid": "token",
	"aria-keyshortcuts": "string",
	"aria-label": "string",
	"aria-labelledby": "idlist",
	"aria-level": "integer",
	"aria-live": "token",
	"aria-modal": "boolean",
	"aria-multiline": "boolean",
	"aria-multiselectable": "boolean",
	"aria-orientation": "token",
	"aria-owns": "idlist",
	"aria-placeholder": "string",
	"aria-posinset": "integer",
	"aria-pressed": "tristate",
	"aria-readonly": "boolean",
	"aria-relevant": "token",
	"aria-required": "boolean",
	"aria-roledescription": "string",
	"aria-rowcount": "integer",
	"aria-rowindex": "integer",
	"aria-rowspan": "integer",
	"aria-selected": "tristate",
	"aria-setsize": "integer",
	"aria-sort": "token",
	"aria-valuemax": "number",
	"aria-valuemin": "number",
	"aria-valuenow": "number",
	"aria-valuetext": "string",
};

const tokenValues: Partial<Record<string, Set<string>>> = {
	"aria-autocomplete": new Set(["both", "inline", "list", "none"]),
	"aria-current": new Set([
		"date",
		"false",
		"location",
		"page",
		"step",
		"time",
		"true",
	]),
	"aria-dropeffect": new Set([
		"copy",
		"execute",
		"link",
		"move",
		"none",
		"popup",
	]),
	"aria-haspopup": new Set([
		"dialog",
		"false",
		"grid",
		"listbox",
		"menu",
		"tree",
		"true",
	]),
	"aria-invalid": new Set(["false", "grammar", "spelling", "true"]),
	"aria-live": new Set(["assertive", "off", "polite"]),
	"aria-orientation": new Set(["horizontal", "undefined", "vertical"]),
	"aria-relevant": new Set([
		"additions",
		"additions text",
		"all",
		"removals",
		"text",
	]),
	"aria-sort": new Set(["ascending", "descending", "none", "other"]),
};

function getAttributeValue(
	property: AST.JsxAttribute,
): boolean | number | string | undefined {
	if (!property.initializer) {
		return true;
	}

	if (property.initializer.kind === SyntaxKind.StringLiteral) {
		return property.initializer.text;
	}

	if (property.initializer.kind === SyntaxKind.JsxExpression) {
		const expression = property.initializer.expression;
		if (!expression) {
			return undefined;
		}

		if (expression.kind === SyntaxKind.TrueKeyword) {
			return true;
		}

		if (expression.kind === SyntaxKind.FalseKeyword) {
			return false;
		}

		if (expression.kind === SyntaxKind.NumericLiteral) {
			return Number(expression.text);
		}

		if (expression.kind === SyntaxKind.StringLiteral) {
			return expression.text;
		}
	}

	return undefined;
}

function getExpectedValueDescription(
	propertyName: string,
	expectedType: AriaPropertyType,
): string {
	switch (expectedType) {
		case "boolean":
			return "true or false";

		case "id":
			return "an ID reference";

		case "idlist":
			return "a space-separated list of IDs";

		case "integer":
			return "an integer";

		case "number":
			return "a number";

		case "string":
			return "a string";

		case "token": {
			const validTokens = tokenValues[propertyName];
			if (validTokens !== undefined) {
				const tokens = Array.from(validTokens).sort();
				return tokens.length > 4
					? `one of: ${tokens.slice(0, 4).join(", ")}, ...`
					: `one of: ${tokens.join(", ")}`;
			}
			return "a valid token value";
		}

		case "tristate":
			return "true, false, or mixed";

		default:
			return "a valid value";
	}
}

function isValidPropertyValue(
	propertyName: string,
	value: boolean | number | string | undefined,
	expectedType: AriaPropertyType,
): boolean {
	if (value === undefined) {
		return true;
	}

	switch (expectedType) {
		case "boolean":
			return (
				value === "true" || value === "false" || typeof value === "boolean"
			);

		case "id":
			return typeof value === "string" && value.length > 0;

		case "idlist":
			return typeof value === "string" && value.trim().length > 0;

		case "integer":
			if (typeof value === "number") {
				return Number.isInteger(value);
			}
			if (typeof value === "string") {
				const num = Number(value);
				return !Number.isNaN(num) && Number.isInteger(num);
			}
			return false;

		case "number":
			if (typeof value === "number") {
				return !Number.isNaN(value);
			}
			if (typeof value === "string") {
				const num = Number(value);
				return !Number.isNaN(num);
			}
			return false;

		case "string":
			return typeof value === "string";

		case "token": {
			if (typeof value !== "string") {
				return false;
			}
			const validTokens = tokenValues[propertyName];
			return validTokens !== undefined
				? validTokens.has(value.toLowerCase())
				: true;
		}

		case "tristate":
			return (
				value === "true" ||
				value === "false" ||
				value === "mixed" ||
				typeof value === "boolean"
			);

		default:
			return true;
	}
}

export default typescriptLanguage.createRule({
	about: {
		description: "Reports ARIA properties with invalid value types.",
		id: "ariaPropTypes",
		preset: "logical",
	},
	messages: {
		invalidPropType: {
			primary:
				"`{{ prop }}` should have a value of {{ expected }}, but received `{{ actual }}`.",
			secondary: [
				"ARIA properties must have values that match their expected type according to the WAI-ARIA specification.",
				"Invalid property values can confuse assistive technologies and lead to accessibility issues.",
				"This is required for WCAG 4.1.2 compliance.",
			],
			suggestions: [
				"Provide a value that matches the expected type for this ARIA property.",
			],
		},
	},
	setup(context) {
		function checkElement(
			node: AST.JsxOpeningElement | AST.JsxSelfClosingElement,
			{ sourceFile }: TypeScriptFileServices,
		) {
			for (const property of node.attributes.properties) {
				if (
					property.kind !== SyntaxKind.JsxAttribute ||
					property.name.kind !== SyntaxKind.Identifier
				) {
					continue;
				}

				const propertyName = property.name.text.toLowerCase();
				if (!propertyName.startsWith("aria-")) {
					continue;
				}

				const expectedType = ariaPropertyTypes[propertyName];
				if (expectedType === undefined) {
					continue;
				}

				const value = getAttributeValue(property);
				if (isValidPropertyValue(propertyName, value, expectedType)) {
					return;
				}

				const expected = getExpectedValueDescription(
					propertyName,
					expectedType,
				);

				context.report({
					data: {
						actual: String(value),
						expected,
						prop: propertyName,
					},
					message: "invalidPropType",
					range: property.initializer
						? getTSNodeRange(property.initializer, sourceFile)
						: getTSNodeRange(property.name, sourceFile),
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
