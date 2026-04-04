import {
	type AST as RegExpAST,
	visitRegExpAST,
} from "@eslint-community/regexpp";
import { typescriptLanguage } from "@flint.fyi/typescript-language";
import type {
	AST,
	TypeScriptFileServices,
} from "@flint.fyi/typescript-language";

import { ruleCreator } from "./ruleCreator.ts";
import { getRegExpConstruction } from "./utils/getRegExpConstruction.ts";
import { getRegExpLiteralDetails } from "./utils/getRegExpLiteralDetails.ts";
import { parseRegexpAst } from "./utils/parseRegexpAst.ts";

type SimpleQuantifier = "*" | "+" | "?";

function combineQuantifiers(
	inner: SimpleQuantifier,
	outer: SimpleQuantifier,
): SimpleQuantifier | undefined {
	if (inner === "+" && outer === "+") {
		return "+";
	}

	if (inner === "+" && outer === "*") {
		return "*";
	}

	if (inner === "?" && outer === "+") {
		return "*";
	}

	if (inner === "?" && outer === "*") {
		return "*";
	}

	if (inner === "*" && outer === "+") {
		return "*";
	}

	if (inner === "*" && outer === "*") {
		return "*";
	}

	return undefined;
}

function formatQuantifier(quantifier: SimpleQuantifier, greedy: boolean) {
	return greedy ? quantifier : `${quantifier}?`;
}

function getSimpleQuantifier(
	min: number,
	max: number,
): SimpleQuantifier | undefined {
	if (min === 0 && max === 1) {
		return "?";
	}

	if (min === 0 && max === Infinity) {
		return "*";
	}

	if (min === 1 && max === Infinity) {
		return "+";
	}

	return undefined;
}

export default ruleCreator.createRule(typescriptLanguage, {
	about: {
		description:
			"Reports trivially nested quantifiers in regular expressions that can be simplified.",
		id: "regexUnnecessaryNestedQuantifiers",
		presets: ["logical"],
	},
	messages: {
		unnecessaryNestedQuantifiers: {
			primary:
				"The nested quantifiers `{{ original }}` can be simplified to `{{ replacement }}`.",
			secondary: [
				"A quantifier wrapping a non-capturing group with a single quantified element can be simplified to a single quantifier.",
			],
			suggestions: ["Replace with `{{ replacement }}`."],
		},
	},
	setup(context) {
		function checkPattern(
			pattern: string,
			patternStart: number,
			flags: string,
		) {
			const regexpAst = parseRegexpAst(pattern, flags);
			if (!regexpAst) {
				return;
			}

			visitRegExpAST(regexpAst, {
				onQuantifierEnter(outerQuantifier) {
					const outerSimple = getSimpleQuantifier(
						outerQuantifier.min,
						outerQuantifier.max,
					);
					if (!outerSimple) {
						return;
					}

					const group = outerQuantifier.element;
					if (group.type !== "Group" || group.alternatives.length !== 1) {
						return;
					}

					// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
					const alternative = group.alternatives[0]!;

					if (alternative.elements.length !== 1) {
						return;
					}

					// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
					const innerElement = alternative.elements[0]!;

					if (innerElement.type !== "Quantifier") {
						return;
					}

					const innerSimple = getSimpleQuantifier(
						innerElement.min,
						innerElement.max,
					);
					if (!innerSimple || innerElement.greedy !== outerQuantifier.greedy) {
						return;
					}

					const combined = combineQuantifiers(innerSimple, outerSimple);
					if (!combined) {
						return;
					}

					const atom = innerElement.element as RegExpAST.Element;
					const atomRaw = pattern.slice(atom.start, atom.end);
					const replacement = `${atomRaw}${formatQuantifier(combined, outerQuantifier.greedy)}`;

					context.report({
						data: {
							original: outerQuantifier.raw,
							replacement,
						},
						fix: {
							range: {
								begin: patternStart + outerQuantifier.start,
								end: patternStart + outerQuantifier.end,
							},
							text: replacement,
						},
						message: "unnecessaryNestedQuantifiers",
						range: {
							begin: patternStart + outerQuantifier.start,
							end: patternStart + outerQuantifier.end,
						},
					});
				},
			});
		}

		function checkRegexLiteral(
			node: AST.RegularExpressionLiteral,
			{ sourceFile }: TypeScriptFileServices,
		) {
			const details = getRegExpLiteralDetails(node, { sourceFile });
			checkPattern(details.pattern, details.start, details.flags);
		}

		function checkRegExpConstructor(
			node: AST.CallExpression | AST.NewExpression,
			services: TypeScriptFileServices,
		) {
			const construction = getRegExpConstruction(node, services);
			if (!construction) {
				return;
			}

			checkPattern(
				construction.pattern,
				construction.start + 1,
				construction.flags,
			);
		}

		return {
			visitors: {
				CallExpression: checkRegExpConstructor,
				NewExpression: checkRegExpConstructor,
				RegularExpressionLiteral: checkRegexLiteral,
			},
		};
	},
});
