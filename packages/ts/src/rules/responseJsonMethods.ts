import {
	type AST,
	getTSNodeRange,
	typescriptLanguage,
} from "@flint.fyi/typescript-language";
import * as ts from "typescript";

import { ruleCreator } from "./ruleCreator.ts";

function isAcceptableSecondArgument(node: ts.Node) {
	return isEmptyObjectLiteral(node) || isJsonContentTypeHeadersObject(node);
}

function isEmptyObjectLiteral(node: ts.Node) {
	return ts.isObjectLiteralExpression(node) && !node.properties.length;
}

function isJsonContentTypeHeader(node: ts.Node) {
	if (!ts.isObjectLiteralExpression(node) || node.properties.length !== 1) {
		return false;
	}

	// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
	const property = node.properties[0]!;

	return (
		ts.isPropertyAssignment(property) &&
		(ts.isIdentifier(property.name) || ts.isStringLiteral(property.name)) &&
		// TODO: Use a util like getStaticValue
		// https://github.com/flint-fyi/flint/issues/1298
		property.name.text.toLowerCase() === "content-type" &&
		ts.isStringLiteral(property.initializer) &&
		property.initializer.text.toLowerCase().startsWith("application/json")
	);
}

function isJsonContentTypeHeadersObject(node: ts.Node) {
	if (!ts.isObjectLiteralExpression(node) || node.properties.length !== 1) {
		return false;
	}

	// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
	const property = node.properties[0]!;

	return (
		ts.isPropertyAssignment(property) &&
		(ts.isIdentifier(property.name) || ts.isStringLiteral(property.name)) &&
		property.name.text.toLowerCase() === "headers" &&
		isJsonContentTypeHeader(property.initializer)
	);
}

function isJsonStringifyCall(node: ts.Node): node is AST.CallExpression {
	return (
		ts.isCallExpression(node) &&
		ts.isPropertyAccessExpression(node.expression) &&
		ts.isIdentifier(node.expression.expression) &&
		node.expression.expression.text === "JSON" &&
		ts.isIdentifier(node.expression.name) &&
		node.expression.name.text === "stringify"
	);
}

export default ruleCreator.createRule(typescriptLanguage, {
	about: {
		description:
			"Prefer `Response.json()` over `new Response(JSON.stringify(...))` for JSON responses.",
		id: "responseJsonMethods",
		presets: ["stylistic"],
	},
	messages: {
		preferResponseJson: {
			primary:
				"Prefer the cleaner `Response.json()` instead of `new Response(JSON.stringify(...))`.",
			secondary: [
				"Response.json() is more concise and sets the Content-Type header automatically.",
			],
			suggestions: ["Replace with `Response.json()`."],
		},
	},
	setup(context) {
		return {
			visitors: {
				NewExpression: (node, { sourceFile }) => {
					if (
						!ts.isIdentifier(node.expression) ||
						node.expression.text !== "Response" ||
						!node.arguments?.length ||
						node.arguments.length > 2
					) {
						return;
					}

					// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
					const firstArgument = node.arguments[0]!;

					if (
						!isJsonStringifyCall(firstArgument) ||
						firstArgument.arguments.length !== 1
					) {
						return;
					}

					if (
						node.arguments.length === 2 &&
						// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
						!isAcceptableSecondArgument(node.arguments[1]!)
					) {
						return;
					}

					context.report({
						message: "preferResponseJson",
						range: getTSNodeRange(node, sourceFile),
					});
				},
			},
		};
	},
});
