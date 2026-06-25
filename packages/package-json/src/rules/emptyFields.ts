import type {
	ArrayNode,
	ElementNode,
	MemberNode,
	ObjectNode,
} from "@humanwhocodes/momoa";
import { z } from "zod/v4";

import { getNodeRange, jsonLanguage } from "@flint.fyi/json-language";

import { removeArrayElement } from "../removeArrayElement.ts";
import { removeObjectProperty } from "../removeObjectProperty.ts";
import { ruleCreator } from "../ruleCreator.ts";

export default ruleCreator.createRule(jsonLanguage, {
	about: {
		description:
			"Reports empty package.json fields that do not add package metadata.",
		id: "emptyFields",
		presets: ["logical"],
	},
	messages: {
		emptyElement: {
			primary: "This empty element does not add package metadata.",
			secondary: [
				"Empty arrays and objects in package.json often come from placeholder fields or incomplete configuration.",
			],
			suggestions: ["Remove the empty element."],
		},
		emptyField: {
			primary: "This empty field does not add package metadata.",
			secondary: [
				"Empty arrays and objects in package.json often come from placeholder fields or incomplete configuration.",
			],
			suggestions: ["Remove the empty field."],
		},
	},
	options: {
		ignoreProperties: z
			.array(z.string())
			.default(["files"])
			.describe("Top-level package.json properties to ignore."),
	},
	setup(context) {
		function checkArrayElement(element: ElementNode, arrayNode: ArrayNode) {
			const elementValue = element.value;
			if (elementValue.type === "Array") {
				if (!elementValue.elements.length) {
					reportArrayElement(element, arrayNode);
					return;
				}

				for (const nestedElement of elementValue.elements) {
					checkArrayElement(nestedElement, elementValue);
				}

				return;
			}

			if (elementValue.type !== "Object") {
				return;
			}

			if (!elementValue.members.length) {
				reportArrayElement(element, arrayNode);
				return;
			}

			for (const property of elementValue.members) {
				if (property.name.type === "String") {
					checkPropertyValue(property, elementValue);
				}
			}
		}

		function checkPropertyValue(property: MemberNode, objectNode: ObjectNode) {
			const valueNode = property.value;

			if (valueNode.type === "Array") {
				if (!valueNode.elements.length) {
					reportPropertyValue(property, objectNode);
					return;
				}

				for (const element of valueNode.elements) {
					checkArrayElement(element, valueNode);
				}

				return;
			}

			if (valueNode.type !== "Object") {
				return;
			}

			if (!valueNode.members.length) {
				reportPropertyValue(property, objectNode);
				return;
			}

			for (const nestedProperty of valueNode.members) {
				if (nestedProperty.name.type === "String") {
					checkPropertyValue(nestedProperty, valueNode);
				}
			}
		}

		function reportArrayElement(element: ElementNode, arrayNode: ArrayNode) {
			const { range, text } = removeArrayElement(element, arrayNode);

			context.report({
				message: "emptyElement",
				range: getNodeRange(element.value),
				suggestions: [
					{
						id: "removeEmptyField",
						range,
						text,
					},
				],
			});
		}

		function reportPropertyValue(property: MemberNode, objectNode: ObjectNode) {
			if (property.name.type !== "String") {
				return;
			}

			const { range, text } = removeObjectProperty(property, objectNode);

			context.report({
				message: "emptyField",
				range: getNodeRange(property.name),
				suggestions: [
					{
						id: "removeEmptyField",
						range,
						text,
					},
				],
			});
		}

		return {
			visitors: {
				Document(node, { options }) {
					const ignoredProperties = new Set(options.ignoreProperties);

					const documentBody = node.body;
					if (documentBody.type !== "Object") {
						return;
					}

					for (const property of documentBody.members) {
						if (
							property.name.type === "String" &&
							!ignoredProperties.has(property.name.value)
						) {
							checkPropertyValue(property, documentBody);
						}
					}
				},
			},
		};
	},
});
