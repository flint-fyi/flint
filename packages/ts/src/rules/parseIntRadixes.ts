import {
	type AST,
	type Checker,
	getTSNodeRange,
	isGlobalDeclarationOfName,
	type TypeScriptFileServices,
	typescriptLanguage,
} from "@flint.fyi/typescript-language";
import * as ts from "typescript";

import { ruleCreator } from "./ruleCreator.ts";

function isParseIntCall(node: AST.CallExpression, typeChecker: Checker) {
	switch (node.expression.kind) {
		case ts.SyntaxKind.Identifier:
			return isGlobalDeclarationOfName(
				node.expression,
				"parseInt",
				typeChecker,
			);

		case ts.SyntaxKind.PropertyAccessExpression:
			return (
				ts.isIdentifier(node.expression.name) &&
				node.expression.name.text === "parseInt" &&
				ts.isIdentifier(node.expression.expression) &&
				node.expression.expression.text === "Number" &&
				isGlobalDeclarationOfName(
					node.expression.expression,
					"Number",
					typeChecker,
				)
			);

		default:
			return false;
	}
}

// TODO: Use a util like getStaticValue
// https://github.com/flint-fyi/flint/issues/1298
function isValidRadix(argument: AST.Expression) {
	switch (argument.kind) {
		case ts.SyntaxKind.Identifier:
			return argument.text !== "undefined";

		case ts.SyntaxKind.NumericLiteral:
			return isValidRadixValue(Number(argument.text));

		case ts.SyntaxKind.PrefixUnaryExpression:
			return (
				argument.operator === ts.SyntaxKind.MinusToken &&
				ts.isNumericLiteral(argument.operand) &&
				isValidRadixValue(-Number(argument.operand.text))
			);

		default:
			return true;
	}
}

function isValidRadixValue(value: number) {
	return value >= 2 && value <= 36;
}

export default ruleCreator.createRule(typescriptLanguage, {
	about: {
		description:
			"Reports parseInt calls that are missing or have an invalid radix parameter.",
		id: "parseIntRadixes",
		presets: ["logical"],
	},
	messages: {
		invalidRadix: {
			primary: "Invalid radix parameter; must be an integer between 2 and 36.",
			secondary: [
				"The radix determines the base of the numeral system used for parsing.",
				"Valid radix values are integers from 2 (binary) to 36.",
			],
			suggestions: [
				"Use a valid radix value, typically 10 for decimal numbers.",
			],
		},
		missingRadix: {
			primary:
				"This `parseInt` call is missing a radix parameter to specify the numeral system base.",
			secondary: [
				"Without a radix, parseInt may interpret the string differently based on its format.",
				"For example, strings starting with '0' were historically parsed as octal.",
			],
			suggestions: ["Add an explicit radix parameter."],
		},
	},
	setup(context) {
		return {
			visitors: {
				CallExpression: (
					node,
					{ sourceFile, typeChecker }: TypeScriptFileServices,
				) => {
					if (!isParseIntCall(node, typeChecker)) {
						return;
					}

					if (node.arguments.length <= 1) {
						context.report({
							message: "missingRadix",
							range: getTSNodeRange(node, sourceFile),
						});
						return;
					}

					// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
					const radixArgument = node.arguments[1]!;

					if (!isValidRadix(radixArgument)) {
						context.report({
							message: "invalidRadix",
							range: getTSNodeRange(radixArgument, sourceFile),
						});
					}
				},
			},
		};
	},
});
