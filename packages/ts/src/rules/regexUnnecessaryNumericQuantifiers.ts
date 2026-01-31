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

function getQuantifierSuffix(quantifier: RegExpAST.Quantifier) {
	const startOffset = quantifier.element.end - quantifier.start;
	return quantifier.raw.slice(startOffset);
}

function isUnnecessaryNumericRangeQuantifier(quantifierSuffix: string) {
	const base = quantifierSuffix.endsWith("?")
		? quantifierSuffix.slice(0, -1)
		: quantifierSuffix;
	return /^\{\d+,\d+\}$/.test(base);
}

export default ruleCreator.createRule(typescriptLanguage, {
	about: {
		description:
			"Reports numeric quantifiers like '{n,n}' that can be simplified to '{n}'.",
		id: "regexUnnecessaryNumericQuantifiers",
		presets: ["logical"],
	},
	messages: {
		unnecessaryNumericQuantifier: {
			primary:
				"This numeric quantifier `{{ raw }}` can be simplified to `{{ simplified }}`.",
			secondary: [
				"Numeric quantifiers with the same minimum and maximum can be written more concisely.",
				"Using the simpler form results in an easier-to-read regular expression.",
			],
			suggestions: ["Replace `{{ raw }}` with `{{ simplified }}`."],
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
				onQuantifierEnter(quantifier) {
					if (quantifier.min !== quantifier.max) {
						return;
					}

					const quantifierSuffix = getQuantifierSuffix(quantifier);
					if (!isUnnecessaryNumericRangeQuantifier(quantifierSuffix)) {
						return;
					}

					const simplified = `{${quantifier.min}}${quantifier.greedy ? "" : "?"}`;
					const quantifierStart = patternStart + quantifier.element.end;

					context.report({
						data: {
							raw: quantifierSuffix,
							simplified,
						},
						message: "unnecessaryNumericQuantifier",
						range: {
							begin: quantifierStart,
							end: patternStart + quantifier.end,
						},
					});
				},
			});
		}

		function checkRegexLiteral(
			node: AST.RegularExpressionLiteral,
			services: TypeScriptFileServices,
		) {
			const details = getRegExpLiteralDetails(node, services);
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
