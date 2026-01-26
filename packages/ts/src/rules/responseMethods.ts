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
	return ts.isObjectLiteralExpression(node) && node.properties.length === 0;
}

function isJsonContentTypeHeader(node: ts.Node) {
	if (!ts.isObjectLiteralExpression(node)) {
		return false;
	}

	if (node.properties.length !== 1) {
		return false;
	}

	const property = node.properties[0];

	if (!property || !ts.isPropertyAssignment(property)) {
		return false;
	}

	const propertyName = property.name;
	if (!ts.isIdentifier(propertyName) && !ts.isStringLiteral(propertyName)) {
		return false;
	}

	if (propertyName.text.toLowerCase() !== "content-type") {
		return false;
	}

	const propertyValue = property.initializer;
	if (!ts.isStringLiteral(propertyValue)) {
		return false;
	}

	return propertyValue.text.toLowerCase().startsWith("application/json");
}

function isJsonContentTypeHeadersObject(node: ts.Node) {
	if (!ts.isObjectLiteralExpression(node)) {
		return false;
	}

	if (node.properties.length !== 1) {
		return false;
	}

	const property = node.properties[0];

	if (!property || !ts.isPropertyAssignment(property)) {
		return false;
	}

	const propertyName = property.name;
	if (!ts.isIdentifier(propertyName) && !ts.isStringLiteral(propertyName)) {
		return false;
	}

	if (propertyName.text.toLowerCase() !== "headers") {
		return false;
	}

	return isJsonContentTypeHeader(property.initializer);
}

function isJsonStringifyCall(node: ts.Node): node is AST.CallExpression {
	if (!ts.isCallExpression(node)) {
		return false;
	}

	if (!ts.isPropertyAccessExpression(node.expression)) {
		return false;
	}

	const { expression, name } = node.expression;

	return (
		ts.isIdentifier(expression) &&
		expression.text === "JSON" &&
		ts.isIdentifier(name) &&
		name.text === "stringify"
	);
}

export default ruleCreator.createRule(typescriptLanguage, {
	about: {
		description:
			"Prefer `Response.json()` over `new Response(JSON.stringify(...))` for JSON responses.",
		id: "responseMethods",
		presets: ["stylistic"],
	},
	messages: {
		preferResponseJson: {
			primary:
				"Use Response.json() instead of new Response(JSON.stringify(...)).",
			secondary: [
				"Response.json() is more concise and sets the Content-Type header automatically.",
			],
			suggestions: ["Replace with Response.json(data)."],
		},
	},
	setup(context) {
		return {
			visitors: {
				NewExpression: (node, { sourceFile }) => {
					if (
						!ts.isIdentifier(node.expression) ||
						node.expression.text !== "Response"
					) {
						return;
					}

					const args = node.arguments;
					if (!args || args.length === 0 || args.length > 2) {
						return;
					}

					const firstArg = args[0];
					if (!firstArg || !isJsonStringifyCall(firstArg)) {
						return;
					}

					if (firstArg.arguments.length !== 1) {
						return;
					}

					const secondArg = args[1];
					if (secondArg && !isAcceptableSecondArgument(secondArg)) {
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
