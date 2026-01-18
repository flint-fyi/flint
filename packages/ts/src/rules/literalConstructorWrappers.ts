import {
	type AST,
	isGlobalDeclarationOfName,
	type TypeScriptFileServices,
	typescriptLanguage,
} from "@flint.fyi/typescript-language";
import * as ts from "typescript";

import { ruleCreator } from "./ruleCreator.ts";

const literalConstructors = new Set(["BigInt", "Boolean", "Number", "String"]);

function isBooleanLiteral(node: AST.Expression) {
	return (
		node.kind === ts.SyntaxKind.TrueKeyword ||
		node.kind === ts.SyntaxKind.FalseKeyword
	);
}

function isLiteralArgument(node: AST.Expression, constructorName: string) {
	switch (constructorName) {
		case "BigInt":
			return isNumericLiteralForBigInt(node);

		case "Boolean":
			return ts.isLiteralExpression(node) || isBooleanLiteral(node);

		case "Number":
			return ts.isStringLiteral(node) && isValidNumericString(node.text);

		case "String":
			return (
				ts.isNumericLiteral(node) ||
				isBooleanLiteral(node) ||
				ts.isBigIntLiteral(node)
			);

		default:
			return false;
	}
}

function isNumericLiteralForBigInt(node: AST.Expression) {
	return (
		node.kind === ts.SyntaxKind.NumericLiteral && /^-?\d+$/.test(node.text)
	);
}

function isValidNumericString(value: string) {
	const trimmed = value.trim();
	if (trimmed === "") {
		return false;
	}

	const number = Number(trimmed);
	return !Number.isNaN(number) && Number.isFinite(number);
}

export default ruleCreator.createRule(typescriptLanguage, {
	about: {
		description:
			"Prefers literal syntax over constructor function calls for primitive values.",
		id: "literalConstructorWrappers",
		presets: ["stylistic"],
	},
	messages: {
		preferLiteral: {
			primary:
				"Prefer literal syntax over `{{ name }}()` for creating primitive values.",
			secondary: [
				"Literal syntax like `123n` for BigInt or `!!value` for Boolean is more concise and idiomatic.",
				"Constructor calls can be replaced with operators or template literals.",
			],
			suggestions: ["Use literal syntax instead of `{{ name }}()`."],
		},
	},
	setup(context) {
		return {
			visitors: {
				CallExpression: (
					node,
					{ sourceFile, typeChecker }: TypeScriptFileServices,
				) => {
					if (!ts.isIdentifier(node.expression)) {
						return;
					}

					const name = node.expression.text;
					if (
						!literalConstructors.has(name) ||
						node.arguments.length !== 1 ||
						!isGlobalDeclarationOfName(node.expression, name, typeChecker)
					) {
						return;
					}

					// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
					const argument = node.arguments[0]!;

					if (!isLiteralArgument(argument, name)) {
						return;
					}

					context.report({
						data: { name },
						message: "preferLiteral",
						range: {
							begin: node.getStart(sourceFile),
							end: node.expression.getEnd(),
						},
					});
				},
			},
		};
	},
});
