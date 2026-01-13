import {
	type AST,
	getTSNodeRange,
	type TypeScriptFileServices,
	typescriptLanguage,
} from "@flint.fyi/ts";
import ts, { SyntaxKind } from "typescript";

const alternateProperties = new Set(["aria-label", "aria-labelledby", "title"]);

export default typescriptLanguage.createRule({
	about: {
		description: "Reports elements that require alt text but are missing it.",
		id: "altTexts",
		preset: "logical",
	},
	messages: {
		missingAlt: {
			primary:
				"{{ element }} element is missing alt text for non-visual users.",
			secondary: [
				"Alternative text provides a textual description for images and other media.",
				"Screen readers use this text to describe the element to users who cannot see it.",
				"This is required for WCAG 1.1.1 compliance.",
			],
			suggestions: [
				"Add an alt attribute with descriptive text",
				'Use alt="" for decorative images',
				"Use aria-label or aria-labelledby for alternative labeling",
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

			if (elementName === "img" || elementName === "area") {
				checkAltAttribute(attributes, tagName, elementName, sourceFile);
			} else if (elementName === "input") {
				checkInputElement(attributes, tagName, sourceFile);
			} else if (elementName === "object") {
				checkObjectAccessibility(attributes, tagName, sourceFile);
			}
		}

		function checkAltAttribute(
			attributes: AST.JsxAttributes,
			tagName: AST.JsxTagNameExpression,
			elementName: string,
			sourceFile: ts.SourceFile,
		) {
			const properties = attributes.properties.find(
				(attr) =>
					attr.kind === SyntaxKind.JsxAttribute &&
					attr.name.kind === SyntaxKind.Identifier &&
					attr.name.text === "alt",
			);

			const hasAriaLabel = attributes.properties.some(
				(attr) =>
					attr.kind === SyntaxKind.JsxAttribute &&
					attr.name.kind === SyntaxKind.Identifier &&
					(attr.name.text === "aria-label" ||
						attr.name.text === "aria-labelledby") &&
					attr.initializer,
			);

			if (hasAriaLabel) {
				return;
			}

			if (!properties) {
				context.report({
					data: { element: elementName },
					message: "missingAlt",
					range: getTSNodeRange(tagName, sourceFile),
				});
				return;
			}

			if (properties.kind === SyntaxKind.JsxAttribute) {
				if (!properties.initializer) {
					context.report({
						data: { element: elementName },
						message: "missingAlt",
						range: getTSNodeRange(tagName, sourceFile),
					});
				} else if (properties.initializer.kind === SyntaxKind.JsxExpression) {
					const { expression } = properties.initializer;
					if (
						expression &&
						expression.kind === SyntaxKind.Identifier &&
						expression.text === "undefined"
					) {
						context.report({
							data: { element: elementName },
							message: "missingAlt",
							range: getTSNodeRange(tagName, sourceFile),
						});
					}
				}
			}
		}

		function checkInputElement(
			attributes: AST.JsxAttributes,
			tagName: AST.JsxTagNameExpression,
			sourceFile: ts.SourceFile,
		) {
			const typeAttribute = attributes.properties.find(
				(properties) =>
					properties.kind === SyntaxKind.JsxAttribute &&
					properties.name.kind === SyntaxKind.Identifier &&
					properties.name.text === "type",
			);

			if (typeAttribute && typeAttribute.kind === SyntaxKind.JsxAttribute) {
				if (
					typeAttribute.initializer &&
					typeAttribute.initializer.kind === SyntaxKind.StringLiteral &&
					typeAttribute.initializer.text === "image"
				) {
					checkAltAttribute(
						attributes,
						tagName,
						"input[type='image']",
						sourceFile,
					);
				}
			}
		}

		function checkObjectAccessibility(
			attributes: AST.JsxAttributes,
			tagName: AST.JsxTagNameExpression,
			sourceFile: ts.SourceFile,
		) {
			if (
				!attributes.properties.some(
					(property) =>
						property.kind === SyntaxKind.JsxAttribute &&
						property.name.kind === SyntaxKind.Identifier &&
						alternateProperties.has(property.name.text) &&
						property.initializer,
				)
			) {
				context.report({
					data: { element: "object" },
					message: "missingAlt",
					range: getTSNodeRange(tagName, sourceFile),
				});
			}
		}

		return {
			visitors: {
				JsxOpeningElement: checkNode,
				JsxSelfClosingElement: checkNode,
			},
		};
	},
});
