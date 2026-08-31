import {
	isIdentifier,
	isJsxAttribute,
	isJsxElement,
	isJsxSelfClosingElement,
	isStringLiteral,
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
		description: "Reports media elements without captions.",
		id: "mediaCaptions",
		presets: ["logical", "logicalStrict"],
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
			const tagName = isJsxElement(node)
				? node.openingElement.tagName
				: node.tagName;

			if (!isIdentifier(tagName)) {
				return;
			}

			const elementName = tagName.text.toLowerCase();
			if (elementName !== "audio" && elementName !== "video") {
				return;
			}

			const attributes = isJsxElement(node)
				? node.openingElement.attributes
				: node.attributes;

			if (
				attributes.properties.some(
					(properties) =>
						isJsxAttribute(properties) &&
						isIdentifier(properties.name) &&
						properties.name.text === "muted",
				)
			) {
				return;
			}

			if (isJsxElement(node) && node.children.some(isCaptionsTrack)) {
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
	if (!isJsxElement(node) && !isJsxSelfClosingElement(node)) {
		return false;
	}

	const childTagName = isJsxElement(node)
		? node.openingElement.tagName
		: node.tagName;

	if (!isIdentifier(childTagName) || childTagName.text !== "track") {
		return false;
	}

	const childAttributes = isJsxElement(node)
		? node.openingElement.attributes
		: node.attributes;

	return childAttributes.properties.some((property) => {
		if (
			!isJsxAttribute(property) ||
			!isIdentifier(property.name) ||
			property.name.text !== "kind"
		) {
			return false;
		}

		if (property.initializer && isStringLiteral(property.initializer)) {
			return property.initializer.text === "captions";
		}

		return false;
	});
}
