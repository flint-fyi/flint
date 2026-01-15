import {
	type AST,
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
		presets: ["logical"],
	},
	messages: {
		preferLooseNull: {
			primary: "Compare with 'null' rather than 'undefined'",
			secondary: [
				"`x == null` and `x == undefined` are equivalent to each other; both check `x === null || x === undefined`.",
				"Use `x == null` since it is shorter.",
			],
			suggestions: ["Replace 'undefined' with 'null'."],
		},
		preferLooseNullish: {
			primary: "Use loose equality ('{{ looseOp }}') for nullish comparisons.",
			secondary: [
				"When checking for nullish values (null or undefined), loose equality is more concise.",
				"`x == null` checks for both null and undefined, equivalent to `x === null || x === undefined`.",
			],
			suggestions: ["Replace '{{ strictOp }}' with '{{ looseOp }}'."],
		},
		preferStrictEquality: {
			primary:
				"Use strict equality ('{{ strictOp }}') instead of '{{ looseOp }}'",
			secondary: [
				"The loose equality operators '=='/'!=' perform arcane type coercion and are difficult to reason about.",
				"Use strict equality operators '==='/'!==' instead.",
			],
			suggestions: ["Replace '{{ looseOp }} with {{ strictOp }}."],
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
							context.report({
								data: {
									looseOp: operator,
									strictOp: toStrictOperator(operator),
								},
								message: "preferStrictEquality",
								range: {
									begin: node.operatorToken.getStart(sourceFile),
									end: node.operatorToken.getEnd(),
								},
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
						const looseOp = toLooseOperator(operator);
						context.report({
							data: {
								looseOp,
								strictOp: operator,
							},
							message: "preferLooseNullish",
							range: leftIsNullish
								? {
										begin: node.left.getStart(sourceFile),
										end: node.operatorToken.getEnd(),
									}
								: {
										begin: node.operatorToken.getStart(sourceFile),
										end: node.right.getEnd(),
									},
						});
						return;
					}

					if (
						options.nullishComparisonStrictness === "strict" &&
						isLooseComparison
					) {
						const strictOperator = toStrictOperator(operator);
						context.report({
							data: {
								looseOp: operator,
								strictOp: strictOperator,
							},
							message: "preferStrictEquality",
							range: leftIsNullish
								? {
										begin: node.left.getStart(sourceFile),
										end: node.operatorToken.getEnd(),
									}
								: {
										begin: node.operatorToken.getStart(sourceFile),
										end: node.right.getEnd(),
									},
						});
						return;
					}

					// For loose comparisons with nullish values, check the style preference
					if (
						isLooseComparison &&
						options.looseNullishComparisonStyle === "null"
					) {
						const leftIsUndefined = isUndefinedIdentifier(node.left);
						const rightIsUndefined = isUndefinedIdentifier(node.right);

						if (leftIsUndefined || rightIsUndefined) {
							context.report({
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
