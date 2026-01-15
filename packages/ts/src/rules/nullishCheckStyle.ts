import {
	getTSNodeRange,
	typescriptLanguage,
} from "@flint.fyi/typescript-language";
import { z } from "zod";

import { ruleCreator } from "./ruleCreator.ts";
import {
	isNullishLiteral,
	isUndefinedIdentifier,
	toEqualityOperator,
	toLooseOperator,
	toStrictOperator,
} from "./utils/equalityOperatorUtils.ts";

export default ruleCreator.createRule(typescriptLanguage, {
	about: {
		description:
			"Enforces consistent equality operator usage when comparing with null or undefined.",
		id: "equalityNullishOperators",
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
		preferStrictNullish: {
			primary:
				"Use strict equality ('{{ strictOperator }}') for nullish comparisons.",
			secondary: [
				"When nullish comparison strictness is set to 'strict', use strict equality operators for nullish comparisons.",
			],
			suggestions: [
				"Replace '{{ looseOperator }}' with '{{ strictOperator }}'.",
			],
		},
	},
	options: {
		looseNullishComparisonStyle: z.enum(["null", "either"]).default("null"),

		nullishComparisonStrictness: z
			.enum(["strict", "loose", "either"])
			.default("loose"),
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

					if (!(leftIsNullish || rightIsNullish)) {
						// No nullish literals - not handled by this rule
						return;
					}

					if (leftIsNullish && rightIsNullish) {
						// Both are nullish - edge case not handled by this rule
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
							message: "preferStrictNullish",
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
