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

function formatQuantifier(min: number, max: number, greedy: boolean): string {
	let result: string;

	if (min === 0 && max === 1) {
		result = "?";
	} else if (min === 0 && max === Infinity) {
		result = "*";
	} else if (min === 1 && max === Infinity) {
		result = "+";
	} else if (min === max) {
		result = `{${min}}`;
	} else if (max === Infinity) {
		result = `{${min},}`;
	} else {
		result = `{${min},${max}}`;
	}

	return greedy ? result : `${result}?`;
}

function isPotentiallyEmpty(element: RegExpAST.Element): boolean {
	switch (element.type) {
		case "Assertion":
		case "Backreference":
			return true;
		case "CapturingGroup":
		case "Group":
			return element.alternatives.some((alt) =>
				alt.elements.every((el) => isPotentiallyEmpty(el)),
			);
		case "Quantifier":
			return element.min === 0 || isPotentiallyEmpty(element.element);
		default:
			return false;
	}
}

export default ruleCreator.createRule(typescriptLanguage, {
	about: {
		description:
			"Reports quantifiers whose minimum implies they must match but whose element can match empty.",
		id: "regexMisleadingQuantifiers",
		presets: ["logical"],
	},
	messages: {
		confusing: {
			primary:
				"Quantifier minimum is {{ min }} but the element can match empty. Consider using '{{ proposal }}' instead.",
			secondary: [
				"This quantifier suggests it must match at least {{ min }} time(s), but the quantified element can match the empty string, so the effective minimum is 0.",
			],
			suggestions: [
				"Replace the quantifier with one that reflects the actual minimum.",
			],
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
				onQuantifierEnter(qNode) {
					if (qNode.min <= 0 || !isPotentiallyEmpty(qNode.element)) {
						return;
					}

					const proposal = formatQuantifier(0, qNode.max, qNode.greedy);

					context.report({
						data: {
							min: qNode.min,
							proposal,
						},
						message: "confusing",
						range: {
							begin: patternStart + qNode.start,
							end: patternStart + qNode.end,
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
