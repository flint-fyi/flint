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

function getQuantifierOffsets(quantifier: RegExpAST.Quantifier) {
	const element = quantifier.element;
	const startOffset = element.end - quantifier.start;
	const endOffset = quantifier.greedy
		? quantifier.end - quantifier.start
		: quantifier.end - quantifier.start - 1;
	return [startOffset, endOffset] as const;
}

export default ruleCreator.createRule(typescriptLanguage, {
	about: {
		description:
			"Reports quantifiers `{1,}` in regular expressions that should use `+` instead.",
		id: "regexPlusQuantifiers",
		presets: ["stylisticStrict"],
	},
	messages: {
		preferPlus: {
			primary:
				"Prefer the more succinct `+` quantifier instead of `{{ quantifier }}`.",
			secondary: [
				"The `+` quantifier is a more concise way to express matching one or more of the preceding element.",
			],
			suggestions: ["Replace `{{ quantifier }}` with `+`."],
		},
	},
	setup(context) {
		function checkPattern(
			pattern: string,
			patternStart: number,
			flags: string,
			isStringPattern: boolean,
		) {
			const regexpAst = parseRegexpAst(pattern, flags);
			if (!regexpAst) {
				return;
			}

			visitRegExpAST(regexpAst, {
				onQuantifierEnter(quantifier) {
					if (quantifier.min !== 1 || quantifier.max !== Infinity) {
						return;
					}

					const [startOffset, endOffset] = getQuantifierOffsets(quantifier);
					const quantifierText = quantifier.raw.slice(startOffset, endOffset);

					if (quantifierText === "+") {
						return;
					}

					const replacement = quantifier.greedy ? "+" : "+?";

					context.report({
						data: {
							quantifier: quantifierText,
						},
						fix: {
							range: {
								begin: patternStart + quantifier.start + startOffset,
								end:
									patternStart +
									quantifier.start +
									(isStringPattern ? endOffset : quantifier.raw.length),
							},
							text: replacement,
						},
						message: "preferPlus",
						range: {
							begin: patternStart + quantifier.start + startOffset,
							end: patternStart + quantifier.start + endOffset,
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
			checkPattern(details.pattern, details.start, details.flags, false);
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
				construction.raw,
				construction.start + 1,
				construction.flags,
				true,
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
