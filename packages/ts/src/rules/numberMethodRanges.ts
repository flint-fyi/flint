import {
	type AST,
	getTSNodeRange,
	typescriptLanguage,
} from "@flint.fyi/typescript-language";
import { SyntaxKind } from "typescript";

import { ruleCreator } from "./ruleCreator.ts";

const methodSpecs = new Map([
	[
		"toExponential",
		{
			max: 100,
			min: 0,
			name: "toExponential",
		},
	],
	[
		"toFixed",
		{
			max: 100,
			min: 0,
			name: "toFixed",
		},
	],
	[
		"toPrecision",
		{
			max: 100,
			min: 1,
			name: "toPrecision",
		},
	],
	[
		"toString",
		{
			max: 36,
			min: 2,
			name: "toString",
		},
	],
]);

function getMethodName(expression: AST.Expression): string | undefined {
	if (
		expression.kind === SyntaxKind.PropertyAccessExpression &&
		expression.name.kind === SyntaxKind.Identifier
	) {
		return expression.name.text;
	}

	if (
		expression.kind === SyntaxKind.ElementAccessExpression &&
		expression.argumentExpression.kind === SyntaxKind.StringLiteral
	) {
		return expression.argumentExpression.text;
	}

	return undefined;
}

function getNumericValue(node: AST.Expression): number | undefined {
	if (node.kind === SyntaxKind.NumericLiteral) {
		return Number(node.text);
	}

	if (
		node.kind === SyntaxKind.PrefixUnaryExpression &&
		node.operator === SyntaxKind.MinusToken &&
		node.operand.kind === SyntaxKind.NumericLiteral
	) {
		return -Number(node.operand.text);
	}

	return undefined;
}

export default ruleCreator.createRule(typescriptLanguage, {
	about: {
		description:
			"Reports when number method arguments are outside their valid range.",
		id: "numberMethodRanges",
		presets: ["logical", "logicalStrict"],
	},
	messages: {
		outOfRange: {
			primary:
				"The argument `{{value}}` is out of range for `{{method}}`. Use a value between {{min}} and {{max}}.",
			secondary: [
				"Passing an out-of-range argument to `{{method}}` will throw a RangeError at runtime.",
			],
			suggestions: [
				"Check the documentation for `{{method}}` to see the valid range of values.",
			],
		},
	},
	setup(context) {
		return {
			visitors: {
				CallExpression: (node, { sourceFile }) => {
					if (node.arguments.length === 0) {
						return;
					}

					const methodName = getMethodName(node.expression);
					if (!methodName) {
						return;
					}

					const spec = methodSpecs.get(methodName);
					if (!spec) {
						return;
					}

					// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
					const argument = node.arguments[0]!;

					if (argument.kind === SyntaxKind.SpreadElement) {
						return;
					}

					const value = getNumericValue(argument);
					if (value === undefined) {
						return;
					}

					if (
						Number.isInteger(value) &&
						value >= spec.min &&
						value <= spec.max
					) {
						return;
					}

					context.report({
						data: {
							max: String(spec.max),
							method: spec.name,
							min: String(spec.min),
							value: String(value),
						},
						message: "outOfRange",
						range: getTSNodeRange(argument, sourceFile),
					});
				},
			},
		};
	},
});
