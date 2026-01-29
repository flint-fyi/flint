import {
	type AST,
	getTSNodeRange,
	hasSameTokens,
	typescriptLanguage,
	unwrapParenthesizedNode,
} from "@flint.fyi/typescript-language";
import { SyntaxKind } from "typescript";

import { ruleCreator } from "./ruleCreator.ts";
import { isComparisonOperator } from "./utils/operators.ts";

type ComparisonDirection = "equality" | "inequality" | "lower" | "upper";

interface ComparisonInfo {
	direction: ComparisonDirection;
	isStrict: boolean;
	node: AST.BinaryExpression;
	numericValue: null | number;
	operatorKind: SyntaxKind;
	variable: AST.Expression;
}

function checkImpossibleRange(
	comparisons: ComparisonInfo[],
	sourceFile: AST.SourceFile,
) {
	// Find pairs that create impossible ranges
	for (const [i, a] of comparisons.entries()) {
		for (const b of comparisons.slice(i + 1)) {
			// Both must have numeric values
			if (a.numericValue === null || b.numericValue === null) {
				continue;
			}

			// Must compare the same variable
			if (!hasSameTokens(a.variable, b.variable, sourceFile)) {
				continue;
			}

			let lowerBound: ComparisonInfo | undefined;
			let upperBound: ComparisonInfo | undefined;

			if (a.direction === "upper" && b.direction === "lower") {
				upperBound = a;
				lowerBound = b;
			} else if (a.direction === "lower" && b.direction === "upper") {
				upperBound = b;
				lowerBound = a;
			}

			if (!upperBound || !lowerBound) {
				continue;
			}

			// Check if bounds are impossible
			// x <= A && x > B  is impossible if A < B or (A === B)
			// x < A && x >= B  is impossible if A <= B
			const upper = upperBound.numericValue;
			const lower = lowerBound.numericValue;

			if (upper === null || lower === null) {
				continue;
			}

			if (upper < lower) {
				return { lowerBound, upperBound };
			}

			if (upper === lower) {
				// x <= 5 && x >= 5 is valid (effectively x === 5)
				// x <= 5 && x > 5 is impossible
				// x < 5 && x >= 5 is impossible
				// x < 5 && x > 5 is impossible
				// Only impossible if at least one bound is strict
				if (upperBound.isStrict || lowerBound.isStrict) {
					return { lowerBound, upperBound };
				}
			}
		}
	}

	return null;
}

function checkIneffectiveChecks(
	comparisons: ComparisonInfo[],
	sourceFile: AST.SourceFile,
) {
	for (const [i, a] of comparisons.entries()) {
		for (const b of comparisons.slice(i + 1)) {
			// Both must have numeric values
			if (a.numericValue === null || b.numericValue === null) {
				continue;
			}

			// Must compare the same variable
			if (!hasSameTokens(a.variable, b.variable, sourceFile)) {
				continue;
			}

			// Both must have the same direction (both upper or both lower bounds)
			if (a.direction !== b.direction) {
				continue;
			}

			if (a.direction === "upper") {
				// x < 200 && x <= 299  -> x <= 299 is redundant
				// The smaller upper bound is the effective constraint
				if (a.numericValue < b.numericValue) {
					return { stronger: a, weaker: b };
				}
				if (b.numericValue < a.numericValue) {
					return { stronger: b, weaker: a };
				}
				// Equal values with different strictness
				if (a.numericValue === b.numericValue) {
					if (a.isStrict && !b.isStrict) {
						// x < 5 && x <= 5 -> x <= 5 is redundant
						return { stronger: a, weaker: b };
					}
					if (!a.isStrict && b.isStrict) {
						return { stronger: b, weaker: a };
					}
				}
			}

			if (a.direction === "lower") {
				// x > 200 && x >= 100  -> x >= 100 is redundant
				// The larger lower bound is the effective constraint
				if (a.numericValue > b.numericValue) {
					return { stronger: a, weaker: b };
				}
				if (b.numericValue > a.numericValue) {
					return { stronger: b, weaker: a };
				}
				// Equal values with different strictness
				if (a.numericValue === b.numericValue) {
					if (a.isStrict && !b.isStrict) {
						return { stronger: a, weaker: b };
					}
					if (!a.isStrict && b.isStrict) {
						return { stronger: b, weaker: a };
					}
				}
			}
		}
	}

	return null;
}

function checkRedundantOrComparison(
	comparisons: ComparisonInfo[],
	sourceFile: AST.SourceFile,
) {
	for (const [index, a] of comparisons.entries()) {
		for (const b of comparisons.slice(index + 1)) {
			// Must compare the same operands
			if (
				!hasSameTokens(a.variable, b.variable, sourceFile) ||
				!hasSameTokens(a.node.left, b.node.left, sourceFile) ||
				!hasSameTokens(a.node.right, b.node.right, sourceFile)
			) {
				// Also check flipped operands
				if (
					!hasSameTokens(a.node.left, b.node.right, sourceFile) ||
					!hasSameTokens(a.node.right, b.node.left, sourceFile)
				) {
					continue;
				}
			}

			const suggestion = getSimplifiedOperator(a.operatorKind, b.operatorKind);
			if (suggestion) {
				return { first: a, second: b, suggestion };
			}
		}
	}

	return null;
}

function collectComparisonsFromChain(
	node: AST.BinaryExpression,
	operatorKind: SyntaxKind,
) {
	const results: ComparisonInfo[] = [];

	function traverse(expr: AST.Expression): void {
		const unwrapped = unwrapParenthesizedNode(expr);

		if (unwrapped.kind !== SyntaxKind.BinaryExpression) {
			return;
		}

		// If this is part of the chain (same logical operator), recurse
		if (unwrapped.operatorToken.kind === operatorKind) {
			traverse(unwrapped.left);
			traverse(unwrapped.right);
			return;
		}

		// Otherwise, try to extract comparison info
		const info = extractComparisonInfo(unwrapped);
		if (info) {
			results.push(info);
		}
	}

	traverse(node);
	return results;
}

function extractComparisonInfo(node: AST.BinaryExpression) {
	if (!isComparisonOperator(node.operatorToken)) {
		return null;
	}

	const leftNumeric = extractNumericLiteral(node.left);
	const rightNumeric = extractNumericLiteral(node.right);

	// Both sides are numeric or neither - we need exactly one numeric literal
	if (
		(leftNumeric !== null && rightNumeric !== null) ||
		(leftNumeric === null && rightNumeric === null)
	) {
		// For non-numeric comparisons, still return info for same-variable checks
		if (leftNumeric === null && rightNumeric === null) {
			return {
				direction: getComparisonDirection(node.operatorToken.kind),
				isStrict: isStrictComparison(node.operatorToken.kind),
				node,
				numericValue: null,
				operatorKind: node.operatorToken.kind,
				variable: node.left,
			};
		}
		return null;
	}

	// Normalize: variable should be on the left, numeric on the right
	if (leftNumeric !== null) {
		// 5 < x  ->  x > 5
		return {
			direction: flipDirection(getComparisonDirection(node.operatorToken.kind)),
			isStrict: isStrictComparison(node.operatorToken.kind),
			node,
			numericValue: leftNumeric,
			operatorKind: flipOperator(node.operatorToken.kind),
			variable: node.right,
		};
	}

	return {
		direction: getComparisonDirection(node.operatorToken.kind),
		isStrict: isStrictComparison(node.operatorToken.kind),
		node,
		numericValue: rightNumeric,
		operatorKind: node.operatorToken.kind,
		variable: node.left,
	};
}

// TODO: Use a util like getStaticValue
// https://github.com/flint-fyi/flint/issues/1298
function extractNumericLiteral(node: AST.Expression) {
	const unwrapped = unwrapParenthesizedNode(node);

	if (unwrapped.kind === SyntaxKind.NumericLiteral) {
		return Number(unwrapped.text);
	}

	// Handle negative numbers: -5
	if (
		unwrapped.kind === SyntaxKind.PrefixUnaryExpression &&
		unwrapped.operator === SyntaxKind.MinusToken &&
		unwrapped.operand.kind === SyntaxKind.NumericLiteral
	) {
		return -Number(unwrapped.operand.text);
	}

	// Handle positive prefix: +5
	if (
		unwrapped.kind === SyntaxKind.PrefixUnaryExpression &&
		unwrapped.operator === SyntaxKind.PlusToken &&
		unwrapped.operand.kind === SyntaxKind.NumericLiteral
	) {
		return Number(unwrapped.operand.text);
	}

	return null;
}

function flipDirection(direction: ComparisonDirection): ComparisonDirection {
	switch (direction) {
		case "lower":
			return "upper";
		case "upper":
			return "lower";
		default:
			return direction;
	}
}

function flipOperator(operatorKind: SyntaxKind) {
	switch (operatorKind) {
		case SyntaxKind.GreaterThanEqualsToken:
			return SyntaxKind.LessThanEqualsToken;
		case SyntaxKind.GreaterThanToken:
			return SyntaxKind.LessThanToken;
		case SyntaxKind.LessThanEqualsToken:
			return SyntaxKind.GreaterThanEqualsToken;
		case SyntaxKind.LessThanToken:
			return SyntaxKind.GreaterThanToken;
		default:
			return operatorKind;
	}
}

function formatComparison(info: ComparisonInfo, sourceFile: AST.SourceFile) {
	return info.node.getText(sourceFile);
}

function getComparisonDirection(operatorKind: SyntaxKind): ComparisonDirection {
	switch (operatorKind) {
		case SyntaxKind.EqualsEqualsEqualsToken:
		case SyntaxKind.EqualsEqualsToken:
			return "equality";
		case SyntaxKind.ExclamationEqualsEqualsToken:
		case SyntaxKind.ExclamationEqualsToken:
			return "inequality";
		case SyntaxKind.GreaterThanEqualsToken:
		case SyntaxKind.GreaterThanToken:
			return "lower";
		case SyntaxKind.LessThanEqualsToken:
		case SyntaxKind.LessThanToken:
			return "upper";
		default:
			return "equality";
	}
}

function getSimplifiedOperator(op1: SyntaxKind, op2: SyntaxKind) {
	// x === y || x < y  ->  x <= y
	// x === y || x > y  ->  x >= y
	const pairs: [SyntaxKind, SyntaxKind, string][] = [
		[SyntaxKind.EqualsEqualsEqualsToken, SyntaxKind.LessThanToken, "<="],
		[SyntaxKind.EqualsEqualsToken, SyntaxKind.LessThanToken, "<="],
		[SyntaxKind.EqualsEqualsEqualsToken, SyntaxKind.GreaterThanToken, ">="],
		[SyntaxKind.EqualsEqualsToken, SyntaxKind.GreaterThanToken, ">="],
	];

	for (const [a, b, result] of pairs) {
		if ((op1 === a && op2 === b) || (op1 === b && op2 === a)) {
			return result;
		}
	}

	return null;
}

function isStrictComparison(operatorKind: SyntaxKind) {
	return (
		operatorKind === SyntaxKind.LessThanToken ||
		operatorKind === SyntaxKind.GreaterThanToken
	);
}

export default ruleCreator.createRule(typescriptLanguage, {
	about: {
		description:
			"Reports comparisons that are always true, always false, or can be simplified.",
		id: "unnecessaryComparisons",
		presets: ["logical", "logicalStrict"],
	},
	messages: {
		impossibleRange: {
			primary: "This range comparison can never be true.",
			secondary: [
				"The upper bound {{ upperBound }} and lower bound {{ lowerBound }} create an impossible range.",
				"No value can satisfy both conditions simultaneously.",
			],
			suggestions: [
				"Check if the comparison operators or values are correct.",
				"This may indicate swapped values or operators.",
			],
		},
		ineffectiveCheck: {
			primary:
				"The check `{{ weaker }}` is redundant when `{{ stronger }}` is also checked.",
			secondary: [
				"When `{{ stronger }}` is true, `{{ weaker }}` is automatically satisfied.",
			],
			suggestions: ["Remove the redundant check `{{ weaker }}`."],
		},
		redundantComparison: {
			primary: "This comparison can be simplified to `{{ suggestion }}`.",
			secondary: [
				"The combined comparisons are equivalent to a single `{{ suggestion }}` comparison.",
			],
			suggestions: [
				"Replace with a single `{{ suggestion }}` comparison for clearer intent.",
			],
		},
		selfComparison: {
			primary:
				"Comparing a value to itself is unnecessary and likely indicates a logic error.",
			secondary: [
				"Self-comparisons always evaluate to the same result for a given operator.",
				"This pattern often indicates a copy-paste error or typo where different variables were intended.",
			],
			suggestions: [
				"Verify that you intended to compare two different values.",
			],
		},
	},
	setup(context) {
		return {
			visitors: {
				BinaryExpression: (node, { sourceFile }) => {
					// Case 1: Self-comparison check on comparison operators
					if (
						isComparisonOperator(node.operatorToken) &&
						hasSameTokens(node.left, node.right, sourceFile)
					) {
						context.report({
							message: "selfComparison",
							range: getTSNodeRange(node, sourceFile),
						});
						return;
					}

					// Case 2: AND chains - check for impossible ranges and ineffective checks
					if (node.operatorToken.kind === SyntaxKind.AmpersandAmpersandToken) {
						const comparisons = collectComparisonsFromChain(
							node,
							SyntaxKind.AmpersandAmpersandToken,
						);

						if (comparisons.length >= 2) {
							// Check for impossible ranges
							const impossibleRange = checkImpossibleRange(
								comparisons,
								sourceFile,
							);
							if (impossibleRange) {
								context.report({
									data: {
										lowerBound: formatComparison(
											impossibleRange.lowerBound,
											sourceFile,
										),
										upperBound: formatComparison(
											impossibleRange.upperBound,
											sourceFile,
										),
									},
									message: "impossibleRange",
									range: getTSNodeRange(node, sourceFile),
								});
								return;
							}

							// Check for ineffective checks
							const ineffective = checkIneffectiveChecks(
								comparisons,
								sourceFile,
							);
							if (ineffective) {
								context.report({
									data: {
										stronger: formatComparison(
											ineffective.stronger,
											sourceFile,
										),
										weaker: formatComparison(ineffective.weaker, sourceFile),
									},
									message: "ineffectiveCheck",
									range: getTSNodeRange(ineffective.weaker.node, sourceFile),
								});
								return;
							}
						}
					}

					// Case 3: OR chains - check for redundant double comparisons
					if (node.operatorToken.kind === SyntaxKind.BarBarToken) {
						const comparisons = collectComparisonsFromChain(
							node,
							SyntaxKind.BarBarToken,
						);

						if (comparisons.length >= 2) {
							const redundant = checkRedundantOrComparison(
								comparisons,
								sourceFile,
							);
							if (redundant) {
								context.report({
									data: {
										suggestion: redundant.suggestion,
									},
									message: "redundantComparison",
									range: getTSNodeRange(node, sourceFile),
								});
								return;
							}
						}
					}
				},
			},
		};
	},
});
