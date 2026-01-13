import {
	type AST,
	getTSNodeRange,
	type TypeScriptFileServices,
	typescriptLanguage,
} from "@flint.fyi/ts";
import { SyntaxKind } from "typescript";

const requiredAriaPropsForRole: Partial<Record<string, string[]>> = {
	checkbox: ["aria-checked"],
	combobox: ["aria-controls", "aria-expanded"],
	heading: ["aria-level"],
	menuitemcheckbox: ["aria-checked"],
	menuitemradio: ["aria-checked"],
	option: ["aria-selected"],
	radio: ["aria-checked"],
	scrollbar: [
		"aria-controls",
		"aria-valuenow",
		"aria-valuemax",
		"aria-valuemin",
	],
	slider: ["aria-valuenow", "aria-valuemax", "aria-valuemin"],
	spinbutton: ["aria-valuenow", "aria-valuemax", "aria-valuemin"],
	switch: ["aria-checked"],
};

export default typescriptLanguage.createRule({
	about: {
		description: "Reports ARIA roles missing their required ARIA properties.",
		id: "roleRequiredAriaProps",
		preset: "logical",
	},
	messages: {
		missingRequiredProps: {
			primary:
				"Elements with ARIA role `{{ role }}` must have the following ARIA property(s) defined: {{ props }}.",
			secondary: [
				"ARIA roles define how elements are exposed to assistive technologies.",
				"Some roles require specific ARIA properties to function correctly.",
				"This is required for WCAG 4.1.2 compliance.",
			],
			suggestions: ["Add the required ARIA properties to the element."],
		},
	},
	setup(context) {
		function checkElement(
			node: AST.JsxOpeningElement | AST.JsxSelfClosingElement,
			{ sourceFile }: TypeScriptFileServices,
		) {
			const roleAttribute = node.attributes.properties.find(
				(property) =>
					property.kind === SyntaxKind.JsxAttribute &&
					property.name.kind === SyntaxKind.Identifier &&
					property.name.text === "role",
			);

			if (
				!roleAttribute ||
				roleAttribute.kind !== SyntaxKind.JsxAttribute ||
				!roleAttribute.initializer ||
				roleAttribute.initializer.kind !== SyntaxKind.StringLiteral
			) {
				return;
			}

			const role = roleAttribute.initializer.text.toLowerCase();
			const requiredProps = requiredAriaPropsForRole[role];

			if (!requiredProps) {
				return;
			}

			const existingProps = new Set<string>();
			for (const property of node.attributes.properties) {
				if (
					property.kind !== SyntaxKind.JsxAttribute ||
					property.name.kind !== SyntaxKind.Identifier
				) {
					continue;
				}

				const propertyName = property.name.text.toLowerCase();
				if (propertyName.startsWith("aria-")) {
					existingProps.add(propertyName);
				}
			}

			const missingProps = requiredProps.filter(
				(prop) => !existingProps.has(prop),
			);

			if (missingProps.length) {
				context.report({
					data: {
						props: missingProps.join(", "),
						role,
					},
					message: "missingRequiredProps",
					range: getTSNodeRange(roleAttribute, sourceFile),
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
