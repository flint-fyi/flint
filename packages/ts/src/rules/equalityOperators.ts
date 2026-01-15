import {
	type AST,
	getTSNodeRange,
	typescriptLanguage,
	unwrapParenthesizedExpression,
} from "@flint.fyi/typescript-language";
import { SyntaxKind } from "typescript";
import { z } from "zod";

import { ruleCreator } from "./ruleCreator.ts";

type EqualityOperator = "!=" | "!==" | "==" | "===";

function isNullishLiteral(node: AST.Expression): boolean {
	return isNullLiteral(node) || isUndefinedIdentifier(node);
}

function isNullLiteral(node: AST.Expression): boolean {
	const unwrapped = unwrapParenthesizedExpression(node);
	return unwrapped.kind === SyntaxKind.NullKeyword;
}

function isUndefinedIdentifier(node: AST.Expression): boolean {
	const unwrapped = unwrapParenthesizedExpression(node);
	return (
		unwrapped.kind === SyntaxKind.Identifier && unwrapped.text === "undefined"
	);
}

function toEqualityOperator(kind: SyntaxKind): EqualityOperator | undefined {
	switch (kind) {
		case SyntaxKind.EqualsEqualsEqualsToken:
			return "===";
		case SyntaxKind.EqualsEqualsToken:
			return "==";
		case SyntaxKind.ExclamationEqualsEqualsToken:
			return "!==";
		case SyntaxKind.ExclamationEqualsToken:
			return "!=";
		default:
			return undefined;
	}
}

function toLooseOperator(operator: EqualityOperator): EqualityOperator {
	if (operator === "===") {
		return "==";
	}
	if (operator === "!==") {
		return "!=";
	}
	return operator;
}

function toStrictOperator(operator: EqualityOperator): EqualityOperator {
	if (operator === "==") {
		return "===";
	}
	if (operator === "!=") {
		return "!==";
	}
	return operator;
}

export default ruleCreator.createRule(typescriptLanguage, {
	about: {
		description:
			"Enforces consistent use of strict equality operators (=== and !==) over loose equality operators (== and !=).",
		id: "equalityOperators",
		presets: ["logical", "logicalStrict"],
	},
	messages: {
		preferLooseNull: {
			primary: "Compare with 'null' rather than 'undefined'.",
			secondary: [
				"`x == null` and `x == undefined` are equivalent to each other; both check `x === null || x === undefined`.",
				"Use `x == null` since it is shorter.",
			],
			suggestions: ["Replace 'undefined' with 'null'."],
		},
		preferLooseNullish: {
			primary:
				"Use loose equality ('{{ looseOperator }}') for nullish comparisons.",
			secondary: [
				"When checking for nullish values (null or undefined), loose equality is more concise.",
				"`x == null` checks for both null and undefined, equivalent to `x === null || x === undefined`.",
			],
			suggestions: [
				"Replace '{{ strictOperator }}' with '{{ looseOperator }}'.",
			],
		},
		preferStrictEquality: {
			primary:
				"Use strict equality ('{{ strictOperator }}') instead of '{{ looseOperator }}'.",
			secondary: [
				"The loose equality operators '=='/'!=' perform arcane type coercion and are difficult to reason about.",
				"Use strict equality operators '==='/'!==' instead.",
			],
			suggestions: ["Replace '{{ looseOperator }} with {{ strictOperator }}."],
		},
	},
	options: {
		looseNullishComparisonStyle: z
			.enum(["null", "either"])
			.default("null")
			.describe(
				"When loose comparisons are used with nullish values, prefer 'null' (shorter), 'undefined', or allow 'either'.",
			),
		nullishComparisonStrictness: z
			.enum(["strict", "loose", "either"])
			.default("loose")
			.describe(
				"How to handle null/undefined comparisons: 'strict' requires ===, 'loose' requires ==, 'either' allows both.",
			),
	},
	setup(context) {
		return {
			visitors: {
				BinaryExpression: (node, { options, sourceFile }) => {
					const operator = toEqualityOperator(node.operatorToken.kind);
					if (operator == null) {
						// not an equality comparison
						return;
					}

					const isLooseComparison = operator === "==" || operator === "!=";

					const leftIsNullish = isNullishLiteral(node.left);
					const rightIsNullish = isNullishLiteral(node.right);
					const hasNullishComparison = leftIsNullish || rightIsNullish;

					if (!hasNullishComparison) {
						if (isLooseComparison) {
							const strictOperator = toStrictOperator(operator);
							const operatorRange = getTSNodeRange(
								node.operatorToken,
								sourceFile,
							);
							context.report({
								data: {
									looseOperator: operator,
									strictOperator,
								},
								message: "preferStrictEquality",
								range: operatorRange,
								suggestions: [
									{
										id: "useStrictOperator",
										range: operatorRange,
										text: strictOperator,
									},
								],
							});
						}
						return;
					}

					if (leftIsNullish && rightIsNullish) {
						// Weird, definitely an error, but not in scope for this rule.
						return;
					}

					// beyond this point, exactly one of the operands is a nullish literal.

					if (
						options.nullishComparisonStrictness === "loose" &&
						!isLooseComparison
					) {
						const looseOperator = toLooseOperator(operator);
						const operatorRange = getTSNodeRange(
							node.operatorToken,
							sourceFile,
						);
						context.report({
							data: {
								looseOperator,
								strictOperator: operator,
							},
							message: "preferLooseNullish",
							range: leftIsNullish
								? {
										begin: node.left.getStart(sourceFile),
										end: operatorRange.end,
									}
								: {
										begin: operatorRange.begin,
										end: node.right.getEnd(),
									},
							suggestions: [
								{
									id: "useLooseOperator",
									range: operatorRange,
									text: looseOperator,
								},
							],
						});
						return;
					}

					if (
						options.nullishComparisonStrictness === "strict" &&
						isLooseComparison
					) {
						const strictOperator = toStrictOperator(operator);
						const operatorRange = getTSNodeRange(
							node.operatorToken,
							sourceFile,
						);
						context.report({
							data: {
								looseOperator: operator,
								strictOperator,
							},
							message: "preferStrictEquality",
							range: leftIsNullish
								? {
										begin: node.left.getStart(sourceFile),
										end: operatorRange.end,
									}
								: {
										begin: operatorRange.begin,
										end: node.right.getEnd(),
									},
							suggestions: [
								{
									id: "useStrictOperator",
									range: operatorRange,
									text: strictOperator,
								},
							],
						});
						return;
					}

					if (
						isLooseComparison &&
						options.looseNullishComparisonStyle === "null"
					) {
						const leftIsUndefined = isUndefinedIdentifier(node.left);
						const rightIsUndefined = isUndefinedIdentifier(node.right);

						if (leftIsUndefined || rightIsUndefined) {
							context.report({
								fix: [
									{
										range: getTSNodeRange(
											leftIsUndefined ? node.left : node.right,
											sourceFile,
										),
										text: "null",
									},
								],
								message: "preferLooseNull",
								range: leftIsUndefined
									? {
											begin: node.left.getStart(sourceFile),
											end: node.operatorToken.getEnd(),
										}
									: {
											begin: node.operatorToken.getStart(sourceFile),
											end: node.right.getEnd(),
										},
							});
						}
					}
				},
			},
		};
	},
});
