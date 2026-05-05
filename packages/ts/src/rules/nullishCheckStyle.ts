import {
	getTSNodeRange,
	typescriptLanguage,
} from "@flint.fyi/typescript-language";
import { isNullKeyword } from "ts-api-utils";
import { z } from "zod/v4";

import { ruleCreator } from "./ruleCreator.ts";
import {
	isNullishLiteral,
	isUndefinedIdentifier,
	toEqualityOperator,
	toLooseOperator,
	toStrictOperator,
} from "./utils/equalityOperators.ts";

export default ruleCreator.createRule(typescriptLanguage, {
	about: {
		description:
			"Enforces consistent equality operator usage when comparing with null or undefined.",
		id: "nullishCheckStyle",
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
		preferLooseUndefined: {
			primary: "Compare with 'undefined' rather than 'null'.",
			secondary: [
				"`x == null` and `x == undefined` are equivalent to each other; both check `x === null || x === undefined`.",
				"Use `x == undefined`.",
			],
			suggestions: ["Replace 'null' with 'undefined'."],
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
		looseNullishComparisonStyle: z
			.enum(["prefer-null", "prefer-undefined", "ignore"])
			.default("prefer-null"),

		nullishComparisonStrictness: z
			.enum(["double-equals", "triple-equals", "ignore"])
			.default("double-equals"),
	},
	setup(context) {
		return {
			visitors: {
				BinaryExpression: (node, { options, sourceFile }) => {
					const operator = toEqualityOperator(node.operatorToken.kind);

					if (operator == null) {
						return;
					}

					const leftIsNullish = isNullishLiteral(node.left);
					const rightIsNullish = isNullishLiteral(node.right);

					// this rule only considers comparisons where exactly one side is a nullish literal
					if (leftIsNullish === rightIsNullish) {
						return;
					}

					const isLooseComparison = operator === "==" || operator === "!=";

					if (
						options.nullishComparisonStrictness === "double-equals" &&
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
						options.nullishComparisonStrictness === "triple-equals" &&
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

					if (isLooseComparison) {
						if (options.looseNullishComparisonStyle === "prefer-null") {
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
						} else if (
							options.looseNullishComparisonStyle === "prefer-undefined"
						) {
							const leftIsNull = isNullKeyword(node.left);
							const rightIsNull = isNullKeyword(node.right);

							if (leftIsNull || rightIsNull) {
								context.report({
									fix: [
										{
											range: getTSNodeRange(
												leftIsNull ? node.left : node.right,
												sourceFile,
											),
											text: "undefined",
										},
									],
									message: "preferLooseUndefined",
									range: leftIsNull
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
					}
				},
			},
		};
	},
});
