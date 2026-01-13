import {
	type AST,
	getTSNodeRange,
	type TypeScriptFileServices,
	typescriptLanguage,
} from "@flint.fyi/ts";
import { SyntaxKind } from "typescript";

export default typescriptLanguage.createRule({
	about: {
		description: "Reports <iframe> elements without a title prop.",
		id: "iframeTitles",
		preset: "logical",
	},
	messages: {
		missingTitle: {
			primary: "This <iframe> element is missing a `title` prop.",
			secondary: [
				"The title attribute provides a label for the iframe that describes its content to screen reader users.",
				"Without it, users may have difficulty understanding the purpose of the iframe.",
				"This is required for WCAG 2.4.1 and 4.1.2 compliance.",
			],
			suggestions: [
				'Add a descriptive title prop (e.g., title="Embedded content")',
				"Ensure the title clearly describes the iframe's content",
			],
		},
	},
	setup(context) {
		function checkIframe(
			{
				attributes,
				tagName,
			}: AST.JsxOpeningElement | AST.JsxSelfClosingElement,
			{ sourceFile }: TypeScriptFileServices,
		) {
			if (
				tagName.kind !== SyntaxKind.Identifier ||
				tagName.text.toLowerCase() !== "iframe"
			) {
				return;
			}

			const titleAttribute = attributes.properties.find((property) => {
				return (
					property.kind === SyntaxKind.JsxAttribute &&
					property.name.kind === SyntaxKind.Identifier &&
					property.name.text.toLowerCase() === "title"
				);
			});

			if (!titleAttribute || titleAttribute.kind !== SyntaxKind.JsxAttribute) {
				context.report({
					message: "missingTitle",
					range: getTSNodeRange(tagName, sourceFile),
				});
				return;
			}

			if (!titleAttribute.initializer) {
				context.report({
					message: "missingTitle",
					range: getTSNodeRange(tagName, sourceFile),
				});
				return;
			}

			if (titleAttribute.initializer.kind === SyntaxKind.StringLiteral) {
				if (titleAttribute.initializer.text === "") {
					context.report({
						message: "missingTitle",
						range: getTSNodeRange(tagName, sourceFile),
					});
				}
			} else if (titleAttribute.initializer.kind === SyntaxKind.JsxExpression) {
				const { expression } = titleAttribute.initializer;
				if (!expression) {
					return;
				}

				if (
					(expression.kind === SyntaxKind.StringLiteral &&
						expression.text === "") ||
					(expression.kind === SyntaxKind.NoSubstitutionTemplateLiteral &&
						expression.text === "") ||
					(expression.kind === SyntaxKind.Identifier &&
						expression.text === "undefined")
				) {
					context.report({
						message: "missingTitle",
						range: getTSNodeRange(tagName, sourceFile),
					});
				}
			}
		}

		return {
			visitors: {
				JsxOpeningElement: checkIframe,
				JsxSelfClosingElement: checkIframe,
			},
		};
	},
});
