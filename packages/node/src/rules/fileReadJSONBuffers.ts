import {
	isAwaitExpression,
	isCallExpression,
	isIdentifier,
	isObjectLiteralExpression,
	isPropertyAccessExpression,
	isPropertyAssignment,
	isSpreadElement,
	isStringLiteral,
} from "typescript-native/unstable/ast";

import {
	getTSNodeRange,
	typescriptLanguage,
	type AST,
} from "@flint.fyi/typescript-language";
import { nullThrows } from "@flint.fyi/utils";

import { ruleCreator } from "./ruleCreator.ts";

export default ruleCreator.createRule(typescriptLanguage, {
	about: {
		description:
			"Prefer reading JSON files as buffers when using JSON.parse for better performance.",
		id: "fileReadJSONBuffers",
		presets: ["stylistic", "stylisticStrict"],
	},
	messages: {
		preferBufferReading: {
			primary:
				"Prefer reading the JSON file as a buffer instead of specifying UTF-8 encoding.",
			secondary: [
				"`JSON.parse()` can parse buffers directly without needing to convert them to strings first.",
				"Reading files as buffers when parsing JSON avoids unnecessary string conversion overhead.",
			],
			suggestions: ["Remove the encoding argument from the file reading call"],
		},
	},
	setup(context) {
		return {
			visitors: {
				CallExpression(node, { sourceFile }) {
					if (
						!isPropertyAccessExpression(node.expression) ||
						!isIdentifier(node.expression.expression) ||
						node.expression.expression.text !== "JSON" ||
						!isIdentifier(node.expression.name) ||
						node.expression.name.text !== "parse" ||
						node.arguments.length !== 1
					) {
						return;
					}

					const argument = unwrapAwaitExpression(
						nullThrows(
							node.arguments[0],
							"First argument is expected to be present by prior length check",
						),
					);
					if (
						isSpreadElement(argument) ||
						!isReadFileCall(argument) ||
						argument.arguments.length !== 2
					) {
						return;
					}

					const encoding = nullThrows(
						argument.arguments[1],
						"Second argument is expected to be present by prior length check",
					);
					if (isSpreadElement(encoding) || !isUtf8Encoding(encoding)) {
						return;
					}

					context.report({
						message: "preferBufferReading",
						range: getTSNodeRange(encoding, sourceFile),
					});
				},
			},
		};
	},
});

function isReadFileCall(node: AST.Expression): node is AST.CallExpression {
	return (
		isCallExpression(node) &&
		isPropertyAccessExpression(node.expression) &&
		isIdentifier(node.expression.expression) &&
		node.expression.expression.text === "fs" &&
		isIdentifier(node.expression.name) &&
		/^readFile(?:Sync)?$/.test(node.expression.name.text)
	);
}

function isUtf8Encoding(node: AST.Expression): boolean {
	if (isStringLiteral(node)) {
		return isUtf8EncodingString(node.text);
	}

	if (isObjectLiteralExpression(node)) {
		if (node.properties.length !== 1) {
			return false;
		}

		const property = nullThrows(
			node.properties[0],
			"First property is expected to be present by prior length check",
		);
		if (
			!isPropertyAssignment(property) ||
			!isIdentifier(property.name) ||
			property.name.text !== "encoding"
		) {
			return false;
		}

		if (isStringLiteral(property.initializer)) {
			return isUtf8EncodingString(property.initializer.text);
		}
	}

	return false;
}

function isUtf8EncodingString(value: unknown): boolean {
	return typeof value === "string" && /utf-?8/i.test(value);
}

function unwrapAwaitExpression(node: AST.Expression): AST.Expression {
	while (isAwaitExpression(node)) {
		node = node.expression;
	}
	return node;
}
