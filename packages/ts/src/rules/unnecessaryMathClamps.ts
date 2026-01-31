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

function extractNumericLiteral(node: AST.Expression): number | undefined {
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

function isMathMethod(
	node: AST.Expression,
	methodName: string,
	typeChecker: Checker,
): boolean {
	return (
		node.kind === SyntaxKind.PropertyAccessExpression &&
		!node.questionDotToken &&
		node.name.kind === SyntaxKind.Identifier &&
		node.name.text === methodName &&
		node.expression.kind === SyntaxKind.Identifier &&
		isGlobalDeclarationOfName(node.expression, "Math", typeChecker)
	);
}

interface MathMethodInfo {
	arguments: AST.Expression[];
	method: "max" | "min";
	node: AST.CallExpression;
}

function getMathMethodInfo(
	node: AST.Expression,
	typeChecker: Checker,
): MathMethodInfo | undefined {
	const unwrapped = unwrapParenthesizedNode(node);

	if (
		unwrapped.kind !== SyntaxKind.CallExpression ||
		unwrapped.questionDotToken ||
		unwrapped.arguments.length < 1
	) {
		return undefined;
	}

	// Check if there are any spread elements - if so, we can't analyze this
	if (
		unwrapped.arguments.some((arg) => arg.kind === SyntaxKind.SpreadElement)
	) {
		return undefined;
	}

	if (isMathMethod(unwrapped.expression, "min", typeChecker)) {
		return {
			arguments: unwrapped.arguments as AST.Expression[],
			method: "min",
			node: unwrapped,
		};
	}

	if (isMathMethod(unwrapped.expression, "max", typeChecker)) {
		return {
			arguments: unwrapped.arguments as AST.Expression[],
			method: "max",
			node: unwrapped,
		};
	}

	return undefined;
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
				"Math.{{method}} with all constant arguments always returns {{result}}.",
			secondary: [
				"When all arguments to Math.{{method}} are constants, the result is always the same value.",
				"Replace this call with the constant {{result}} directly.",
			],
			suggestions: ["Replace with the constant value {{result}}."],
		},
		incorrectClampOrder: {
			primary:
				"Incorrect clamping pattern: Math.{{outerMethod}}({{min}}, Math.{{innerMethod}}({{max}}, x)) should be Math.min({{max}}, Math.max({{min}}, x)).",
			secondary: [
				"To clamp a value between a minimum and maximum, use Math.min(max, Math.max(min, value)).",
				"The current pattern will not correctly constrain the value to the intended range.",
			],
			suggestions: [
				"Use the correct clamping pattern: Math.min(max, Math.max(min, value)).",
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
					const numericValues = outerInfo.arguments.map((arg) =>
						extractNumericLiteral(arg),
					);

					if (numericValues.every((val) => val !== undefined)) {
						const result =
							outerInfo.method === "min"
								? Math.min(...(numericValues as number[]))
								: Math.max(...(numericValues as number[]));

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
						const [firstArg, secondArg] = outerInfo.arguments;

						if (!firstArg || !secondArg) {
							return;
						}

						const innerInfo = getMathMethodInfo(secondArg, typeChecker);

						if (
							innerInfo &&
							innerInfo.method !== outerInfo.method &&
							innerInfo.arguments.length === 2
						) {
							const outerConstant = extractNumericLiteral(firstArg);
							const innerConstant = extractNumericLiteral(
								innerInfo.arguments[0]!,
							);

							// Incorrect pattern: Math.max(min, Math.min(max, x))
							// where outer is max and inner is min, and min < max
							if (
								outerInfo.method === "max" &&
								innerInfo.method === "min" &&
								outerConstant !== undefined &&
								innerConstant !== undefined &&
								outerConstant < innerConstant
							) {
								context.report({
									data: {
										innerMethod: innerInfo.method,
										max: String(innerConstant),
										min: String(outerConstant),
										outerMethod: outerInfo.method,
									},
									message: "incorrectClampOrder",
									range: getTSNodeRange(node, sourceFile),
								});
								return;
							}

							// Also check if arguments are flipped
							const innerConstantFlipped = extractNumericLiteral(
								innerInfo.arguments[1]!,
							);
							if (
								outerInfo.method === "max" &&
								innerInfo.method === "min" &&
								outerConstant !== undefined &&
								innerConstantFlipped !== undefined &&
								outerConstant < innerConstantFlipped
							) {
								context.report({
									data: {
										innerMethod: innerInfo.method,
										max: String(innerConstantFlipped),
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
