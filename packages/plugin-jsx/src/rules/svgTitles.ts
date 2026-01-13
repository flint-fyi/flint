import {
	type AST,
	getTSNodeRange,
	type TypeScriptFileServices,
	typescriptLanguage,
} from "@flint.fyi/ts";
import { SyntaxKind } from "typescript";

export default typescriptLanguage.createRule({
	about: {
		description: "Reports <svg> elements without a <title> child element.",
		id: "svgTitles",
		preset: "logical",
	},
	messages: {
		missingTitle: {
			primary: "This <svg> element is missing a <title> child element.",
			secondary: [
				"SVG elements without a title are not accessible to screen readers.",
				"The <title> element provides a text description of the SVG's content.",
				"This is required for WCAG 1.1.1 compliance.",
			],
			suggestions: [
				"Add a <title> child element with descriptive text",
				"Use aria-label or aria-labelledby as an alternative",
			],
		},
	},
	setup(context) {
		function hasValidAriaLabel(attributes: AST.JsxAttributes): boolean {
			return attributes.properties.some((property) => {
				if (
					property.kind !== SyntaxKind.JsxAttribute ||
					property.name.kind !== SyntaxKind.Identifier ||
					(property.name.text !== "aria-label" &&
						property.name.text !== "aria-labelledby")
				) {
					return false;
				}

				if (!property.initializer) {
					return false;
				}

				if (property.initializer.kind === SyntaxKind.JsxExpression) {
					const { expression } = property.initializer;
					if (!expression) {
						return false;
					}

					if (
						expression.kind === SyntaxKind.StringLiteral ||
						expression.kind === SyntaxKind.NoSubstitutionTemplateLiteral
					) {
						return expression.text !== "";
					}

					if (expression.kind === SyntaxKind.Identifier) {
						return expression.text !== "undefined";
					}
				}

				if (property.initializer.kind === SyntaxKind.StringLiteral) {
					return property.initializer.text !== "";
				}

				return false;
			});
		}

		function checkElement(
			node: AST.JsxElement | AST.JsxSelfClosingElement,
			{ sourceFile }: TypeScriptFileServices,
		) {
			const tagName =
				node.kind == SyntaxKind.JsxElement
					? node.openingElement.tagName
					: node.tagName;

			if (
				tagName.kind !== SyntaxKind.Identifier ||
				tagName.text.toLowerCase() !== "svg"
			) {
				return;
			}

			const attributes =
				node.kind == SyntaxKind.JsxElement
					? node.openingElement.attributes
					: node.attributes;

			if (hasValidAriaLabel(attributes)) {
				return;
			}

			if (
				node.kind == SyntaxKind.JsxElement &&
				node.children.some(isTitleElement)
			) {
				return;
			}

			context.report({
				message: "missingTitle",
				range: getTSNodeRange(tagName, sourceFile),
			});
		}

		return {
			visitors: {
				JsxElement: checkElement,
				JsxSelfClosingElement: checkElement,
			},
		};
	},
});

function isTitleElement(node: AST.JsxChild) {
	if (
		node.kind !== SyntaxKind.JsxElement &&
		node.kind !== SyntaxKind.JsxSelfClosingElement
	) {
		return false;
	}

	const childTagName =
		node.kind === SyntaxKind.JsxElement
			? node.openingElement.tagName
			: node.tagName;

	return (
		childTagName.kind === SyntaxKind.Identifier && childTagName.text === "title"
	);
}
