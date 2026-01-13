import { type AST, getTSNodeRange, typescriptLanguage } from "@flint.fyi/ts";
import { nullThrows } from "@flint.fyi/utils";
import { SyntaxKind } from "typescript";

export default typescriptLanguage.createRule({
	about: {
		description:
			"Prefer reading JSON files as buffers when using JSON.parse for better performance.",
		id: "fileReadJSONBuffers",
		preset: "stylistic",
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
						node.expression.kind !== SyntaxKind.PropertyAccessExpression ||
						node.expression.expression.kind !== SyntaxKind.Identifier ||
						node.expression.expression.text !== "JSON" ||
						node.expression.name.kind !== SyntaxKind.Identifier ||
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
						argument.kind === SyntaxKind.SpreadElement ||
						!isReadFileCall(argument) ||
						argument.arguments.length !== 2
					) {
						return;
					}

					const encoding = nullThrows(
						argument.arguments[1],
						"Second argument is expected to be present by prior length check",
					);
					if (
						encoding.kind === SyntaxKind.SpreadElement ||
						!isUtf8Encoding(encoding)
					) {
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
		node.kind === SyntaxKind.CallExpression &&
		node.expression.kind === SyntaxKind.PropertyAccessExpression &&
		node.expression.expression.kind === SyntaxKind.Identifier &&
		node.expression.expression.text === "fs" &&
		node.expression.name.kind === SyntaxKind.Identifier &&
		/^readFile(?:Sync)?$/.test(node.expression.name.text)
	);
}

function isUtf8Encoding(node: AST.Expression): boolean {
	if (node.kind === SyntaxKind.StringLiteral) {
		return isUtf8EncodingString(node.text);
	}

	if (node.kind === SyntaxKind.ObjectLiteralExpression) {
		if (node.properties.length !== 1) {
			return false;
		}

		const property = nullThrows(
			node.properties[0],
			"First property is expected to be present by prior length check",
		);
		if (
			property.kind !== SyntaxKind.PropertyAssignment ||
			property.name.kind !== SyntaxKind.Identifier ||
			property.name.text !== "encoding"
		) {
			return false;
		}

		if (property.initializer.kind === SyntaxKind.StringLiteral) {
			return isUtf8EncodingString(property.initializer.text);
		}
	}

	return false;
}

function isUtf8EncodingString(value: unknown): boolean {
	return typeof value === "string" && /utf-?8/i.test(value);
}

function unwrapAwaitExpression(node: AST.Expression): AST.Expression {
	while (node.kind === SyntaxKind.AwaitExpression) {
		node = node.expression;
	}
	return node;
}
