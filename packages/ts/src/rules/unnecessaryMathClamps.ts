import {
	type AST,
	type Checker,
	getTSNodeRange,
	isGlobalDeclarationOfName,
	typescriptLanguage,
	unwrapParenthesizedNode,
} from "@flint.fyi/typescript-language";
import { SyntaxKind } from "typescript";

import { ruleCreator } from "./ruleCreator.ts";

// TODO: Use a util like getStaticValue
// https://github.com/flint-fyi/flint/issues/1298
function extractNumericLiteral(node: AST.Expression) {
	const unwrapped = unwrapParenthesizedNode(node);

	if (unwrapped.kind === SyntaxKind.NumericLiteral) {
		return Number(unwrapped.text);
	}

	if (
		unwrapped.kind === SyntaxKind.PrefixUnaryExpression &&
		unwrapped.operator === SyntaxKind.MinusToken &&
		unwrapped.operand.kind === SyntaxKind.NumericLiteral
	) {
		return -Number(unwrapped.operand.text);
	}

	if (
		unwrapped.kind === SyntaxKind.PrefixUnaryExpression &&
		unwrapped.operator === SyntaxKind.PlusToken &&
		unwrapped.operand.kind === SyntaxKind.NumericLiteral
	) {
		return Number(unwrapped.operand.text);
	}

	return undefined;
}

function getMathMethodInfo(node: AST.Expression, typeChecker: Checker) {
	const unwrapped = unwrapParenthesizedNode(node);

	if (
		unwrapped.kind !== SyntaxKind.CallExpression ||
		unwrapped.questionDotToken ||
		unwrapped.arguments.length < 1 ||
		unwrapped.arguments.some((arg) => arg.kind === SyntaxKind.SpreadElement)
	) {
		return undefined;
	}

	if (isMathMethod(unwrapped.expression, "min", typeChecker)) {
		return {
			arguments: Array.from(unwrapped.arguments),
			method: "min",
			node: unwrapped,
		};
	}

	if (isMathMethod(unwrapped.expression, "max", typeChecker)) {
		return {
			arguments: Array.from(unwrapped.arguments),
			method: "max",
			node: unwrapped,
		};
	}

	return undefined;
}

function isMathMethod(
	node: AST.Expression,
	methodName: string,
	typeChecker: Checker,
) {
	return (
		node.kind === SyntaxKind.PropertyAccessExpression &&
		!node.questionDotToken &&
		node.name.kind === SyntaxKind.Identifier &&
		node.name.text === methodName &&
		node.expression.kind === SyntaxKind.Identifier &&
		isGlobalDeclarationOfName(node.expression, "Math", typeChecker)
	);
}

export default ruleCreator.createRule(typescriptLanguage, {
	about: {
		description:
			"Reports unnecessary Math.min and Math.max calls with constant arguments or incorrect clamping patterns.",
		id: "unnecessaryMathClamps",
		presets: ["logical"],
	},
	messages: {
		constantArguments: {
			primary:
				"This `Math.{{ method }}` with all constant arguments will always return `{{ result }}`.",
			secondary: [
				"When all arguments to `Math.{{ method }}` are constants, the result is always the same value.",
				"You can replace this call with the constant `{{ result }}` directly.",
			],
			suggestions: ["Replace with the constant value `{{ result }}`."],
		},
		incorrectClampOrder: {
			primary:
				"Incorrect clamping pattern: `Math.{{ outerMethod }}({{ min }}, Math.{{ innerMethod }}({{ max }}, x))` should be `Math.min({{max}}, Math.max({{min}}, x))`.",
			secondary: [
				"To clamp a value between a minimum and maximum, use `Math.min(max, Math.max(min, value))`.",
				"The current pattern will not correctly constrain the value to the intended range.",
			],
			suggestions: [
				"Use the correct clamping pattern: `Math.min(max, Math.max(min, value))`.",
			],
		},
	},
	setup(context) {
		return {
			visitors: {
				CallExpression: (node, { sourceFile, typeChecker }) => {
					const outerInfo = getMathMethodInfo(node, typeChecker);
					if (!outerInfo) {
						return;
					}

					// Check for all constant arguments
					const numericValues: number[] = [];
					let allNumeric = true;

					for (const arg of outerInfo.arguments) {
						const value = extractNumericLiteral(arg);
						if (value === undefined) {
							allNumeric = false;
							break;
						}
						numericValues.push(value);
					}

					if (allNumeric) {
						const result =
							outerInfo.method === "min"
								? Math.min(...numericValues)
								: Math.max(...numericValues);

						context.report({
							data: {
								method: outerInfo.method,
								result: String(result),
							},
							message: "constantArguments",
							range: getTSNodeRange(node, sourceFile),
						});
						return;
					}

					// Check for incorrect clamping patterns
					// Pattern: Math.max(min, Math.min(max, x)) is incorrect
					// Correct: Math.min(max, Math.max(min, x))
					if (outerInfo.arguments.length === 2) {
						// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
						const firstArgument = outerInfo.arguments[0]!;
						// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
						const secondArgument = outerInfo.arguments[1]!;

						const innerInfo = getMathMethodInfo(secondArgument, typeChecker);

						if (
							innerInfo &&
							innerInfo.method !== outerInfo.method &&
							innerInfo.arguments.length === 2
						) {
							const innerFirstArg = innerInfo.arguments[0];
							const innerSecondArg = innerInfo.arguments[1];

							if (!innerFirstArg || !innerSecondArg) {
								return;
							}

							const outerConstant = extractNumericLiteral(firstArgument);
							const innerConstantFirst = extractNumericLiteral(innerFirstArg);
							const innerConstantSecond = extractNumericLiteral(innerSecondArg);

							// Incorrect pattern: Math.max(min, Math.min(max, x))
							// where outer is max and inner is min, and min < max
							if (
								outerInfo.method === "max" &&
								innerInfo.method === "min" &&
								outerConstant !== undefined &&
								innerConstantFirst !== undefined &&
								outerConstant < innerConstantFirst
							) {
								context.report({
									data: {
										innerMethod: innerInfo.method,
										max: String(innerConstantFirst),
										min: String(outerConstant),
										outerMethod: outerInfo.method,
									},
									message: "incorrectClampOrder",
									range: getTSNodeRange(node, sourceFile),
								});
								return;
							}

							// Also check if arguments are flipped
							if (
								outerInfo.method === "max" &&
								innerInfo.method === "min" &&
								outerConstant !== undefined &&
								innerConstantSecond !== undefined &&
								outerConstant < innerConstantSecond
							) {
								context.report({
									data: {
										innerMethod: innerInfo.method,
										max: String(innerConstantSecond),
										min: String(outerConstant),
										outerMethod: outerInfo.method,
									},
									message: "incorrectClampOrder",
									range: getTSNodeRange(node, sourceFile),
								});
							}
						}
					}
				},
			},
		};
	},
});
