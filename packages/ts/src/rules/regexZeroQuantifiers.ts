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
			"Reports quantifiers with a maximum of zero, which are useless.",
		id: "regexZeroQuantifiers",
		presets: ["logical"],
	},
	messages: {
		uselessZero: {
			primary: "Quantifier '{{ raw }}' has a maximum of 0 and is useless.",
			secondary: [
				"This quantified element will always be repeated zero times and can be removed.",
			],
			suggestions: ["Remove the quantifier and its quantified element."],
		},
	},
	setup(context) {
		function checkPattern(
			pattern: string,
			patternStart: number,
			flags: string,
			emptyReplacement: string,
		) {
			const regexpAst = parseRegexpAst(pattern, flags);
			if (!regexpAst) {
				return;
			}

			visitRegExpAST(regexpAst, {
				onQuantifierEnter(node) {
					if (node.max !== 0) {
						return;
					}

					const range = {
						begin: patternStart + node.start,
						end: patternStart + node.end,
					};
					const isWholePattern =
						node.start === 0 && node.end === pattern.length;

					context.report({
						data: {
							raw: node.raw,
						},
						fix: {
							range,
							text: isWholePattern ? emptyReplacement : "",
						},
						message: "uselessZero",
						range,
					});
				},
			});
		}

		function checkRegexLiteral(
			node: AST.RegularExpressionLiteral,
			{ sourceFile }: TypeScriptFileServices,
		) {
			const details = getRegExpLiteralDetails(node, { sourceFile });
			checkPattern(details.pattern, details.start, details.flags, "(?:)");
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
				"",
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
