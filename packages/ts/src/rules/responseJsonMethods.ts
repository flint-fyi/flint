import { SyntaxKind } from "typescript";

import {
	getTSNodeRange,
	typescriptLanguage,
	type AST,
} from "@flint.fyi/typescript-language";

import { ruleCreator } from "./ruleCreator.ts";

function isAcceptableSecondArgument(node: AST.AnyNode) {
	return isEmptyObjectLiteral(node) || isJsonContentTypeHeadersObject(node);
}

function isEmptyObjectLiteral(node: AST.AnyNode) {
	return (
		node.kind === SyntaxKind.ObjectLiteralExpression && !node.properties.length
	);
}

function isJsonContentTypeHeader(node: AST.AnyNode) {
	if (
		node.kind !== SyntaxKind.ObjectLiteralExpression ||
		node.properties.length !== 1
	) {
		return false;
	}

	// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
	const property = node.properties[0]!;

	return (
		property.kind === SyntaxKind.PropertyAssignment &&
		(property.name.kind === SyntaxKind.Identifier ||
			property.name.kind === SyntaxKind.StringLiteral) &&
		// TODO: Use a util like getStaticValue
		// https://github.com/flint-fyi/flint/issues/1298
		property.name.text.toLowerCase() === "content-type" &&
		property.initializer.kind === SyntaxKind.StringLiteral &&
		property.initializer.text.toLowerCase().startsWith("application/json")
	);
}

function isJsonContentTypeHeadersObject(node: AST.AnyNode) {
	if (
		node.kind !== SyntaxKind.ObjectLiteralExpression ||
		node.properties.length !== 1
	) {
		return false;
	}

	// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
	const property = node.properties[0]!;

	return (
		property.kind === SyntaxKind.PropertyAssignment &&
		(property.name.kind === SyntaxKind.Identifier ||
			property.name.kind === SyntaxKind.StringLiteral) &&
		property.name.text.toLowerCase() === "headers" &&
		isJsonContentTypeHeader(property.initializer)
	);
}

function isJsonStringifyCall(node: AST.AnyNode): node is AST.CallExpression {
	return (
		node.kind === SyntaxKind.CallExpression &&
		node.expression.kind === SyntaxKind.PropertyAccessExpression &&
		node.expression.expression.kind === SyntaxKind.Identifier &&
		node.expression.expression.text === "JSON" &&
		node.expression.name.kind === SyntaxKind.Identifier &&
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
						node.expression.kind !== SyntaxKind.Identifier ||
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
