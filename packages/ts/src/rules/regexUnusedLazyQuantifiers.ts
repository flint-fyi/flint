import { visitRegExpAST } from "@eslint-community/regexpp";
import { typescriptLanguage } from "@flint.fyi/typescript-language";
import type {
	AST,
	TypeScriptFileServices,
} from "@flint.fyi/typescript-language";

import { ruleCreator } from "./ruleCreator.ts";
import { getRegExpConstruction } from "./utils/getRegExpConstruction.ts";
import { getRegExpLiteralDetails } from "./utils/getRegExpLiteralDetails.ts";
import { parseRegexpAst } from "./utils/parseRegexpAst.ts";

export default ruleCreator.createRule(typescriptLanguage, {
	about: {
		description:
			"Reports lazy quantifiers that have no effect because the quantifier is constant.",
		id: "regexUnusedLazyQuantifiers",
		presets: ["logical"],
	},
	messages: {
		uselessLazy: {
			primary:
				"Lazy quantifier `{{ raw }}` has no effect because the quantifier matches exactly {{ count }} time(s).",
			secondary: [
				"When a quantifier has fixed bounds (min equals max), there is no choice in how many times to match, so lazy vs greedy is irrelevant.",
			],
			suggestions: ["Remove the '?' to use the greedy form."],
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
				onQuantifierEnter(node) {
					if (!node.greedy && node.min === node.max) {
						const range = {
							begin: patternStart + node.start,
							end: patternStart + node.end,
						};
						context.report({
							data: {
								count: node.min,
								raw: node.raw,
							},
							fix: {
								range,
								text: node.raw.slice(0, -1),
							},
							message: "uselessLazy",
							range,
						});
					}
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
