import {
	type AST,
	getTSNodeRange,
	type TypeScriptFileServices,
	typescriptLanguage,
} from "@flint.fyi/ts";
import { SyntaxKind } from "typescript";

export default typescriptLanguage.createRule({
	about: {
		description: "Reports media elements without captions.",
		id: "mediaCaptions",
		preset: "logical",
	},
	messages: {
		missingCaptions: {
			primary: "This media element is missing <track> element captions.",
			secondary: [
				"Captions are essential for deaf users to follow along with media content.",
				"The <track> element with kind='captions' provides this accessibility feature.",
				"This is required for WCAG 1.2.2 and 1.2.3 compliance.",
			],
			suggestions: [
				'Add a <track kind="captions"> element as a child',
				"Add the muted attribute if the media has no audio",
			],
		},
	},
	setup(context) {
		function checkMediaElement(
			node: AST.JsxElement | AST.JsxSelfClosingElement,
			{ sourceFile }: TypeScriptFileServices,
		) {
			const tagName =
				node.kind == SyntaxKind.JsxElement
					? node.openingElement.tagName
					: node.tagName;

			if (tagName.kind != SyntaxKind.Identifier) {
				return;
			}

			const elementName = tagName.text.toLowerCase();
			if (elementName !== "audio" && elementName !== "video") {
				return;
			}

			const attributes =
				node.kind == SyntaxKind.JsxElement
					? node.openingElement.attributes
					: node.attributes;

			if (
				attributes.properties.some(
					(properties) =>
						properties.kind == SyntaxKind.JsxAttribute &&
						properties.name.kind == SyntaxKind.Identifier &&
						properties.name.text === "muted",
				)
			) {
				return;
			}

			if (
				node.kind == SyntaxKind.JsxElement &&
				node.children.some(isCaptionsTrack)
			) {
				return;
			}

			context.report({
				message: "missingCaptions",
				range: getTSNodeRange(tagName, sourceFile),
			});
		}

		return {
			visitors: {
				JsxElement: checkMediaElement,
				JsxSelfClosingElement: checkMediaElement,
			},
		};
	},
});

function isCaptionsTrack(node: AST.JsxChild) {
	if (
		node.kind != SyntaxKind.JsxElement &&
		node.kind != SyntaxKind.JsxSelfClosingElement
	) {
		return false;
	}

	const childTagName =
		node.kind == SyntaxKind.JsxElement
			? node.openingElement.tagName
			: node.tagName;

	if (
		childTagName.kind != SyntaxKind.Identifier ||
		childTagName.text !== "track"
	) {
		return false;
	}

	const childAttributes =
		node.kind == SyntaxKind.JsxElement
			? node.openingElement.attributes
			: node.attributes;

	return childAttributes.properties.some((property) => {
		if (
			property.kind != SyntaxKind.JsxAttribute ||
			property.name.kind != SyntaxKind.Identifier ||
			property.name.text !== "kind"
		) {
			return false;
		}

		if (property.initializer?.kind == SyntaxKind.StringLiteral) {
			return property.initializer.text === "captions";
		}

		return false;
	});
}
