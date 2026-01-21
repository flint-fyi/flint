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

const validRadixValues = new Set(
	Array.from({ length: 37 - 2 }, (_, index) => index + 2),
);

function isParseIntCall(node: AST.CallExpression, typeChecker: Checker) {
	const expression = node.expression;

	if (ts.isIdentifier(expression)) {
		return isGlobalDeclarationOfName(expression, "parseInt", typeChecker);
	}

	if (
		ts.isPropertyAccessExpression(expression) &&
		ts.isIdentifier(expression.name) &&
		expression.name.text === "parseInt" &&
		ts.isIdentifier(expression.expression) &&
		expression.expression.text === "Number"
	) {
		return isGlobalDeclarationOfName(
			expression.expression,
			"Number",
			typeChecker,
		);
	}

	return false;
}

function isValidRadix(argument: AST.Expression) {
	if (ts.isNumericLiteral(argument)) {
		const value = Number(argument.text);
		return validRadixValues.has(value);
	}

	if (
		ts.isPrefixUnaryExpression(argument) &&
		argument.operator === ts.SyntaxKind.MinusToken &&
		ts.isNumericLiteral(argument.operand)
	) {
		const value = -Number(argument.operand.text);
		return validRadixValues.has(value);
	}

	if (ts.isIdentifier(argument) && argument.text === "undefined") {
		return false;
	}

	return true;
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
			primary: "Missing radix parameter in parseInt call.",
			secondary: [
				"Without a radix, parseInt may interpret the string differently based on its format.",
				"For example, strings starting with '0' were historically parsed as octal.",
			],
			suggestions: [
				"Add an explicit radix parameter, typically 10 for decimal numbers: parseInt(value, 10)",
			],
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

					const argumentsCount = node.arguments.length;

					if (argumentsCount === 0) {
						context.report({
							message: "missingRadix",
							range: getTSNodeRange(node, sourceFile),
						});
						return;
					}

					if (argumentsCount === 1) {
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
