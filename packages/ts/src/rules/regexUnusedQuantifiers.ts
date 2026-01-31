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
			"Reports quantifiers that match exactly once, making them unnecessary.",
		id: "regexUnusedQuantifiers",
		presets: ["logical"],
	},
	messages: {
		uselessQuantifier: {
			primary:
				"Quantifier `{{ raw }}` is unnecessary because it matches exactly once.",
			secondary: [
				"A quantifier that matches exactly once can be removed without changing the pattern's behavior.",
			],
			suggestions: [
				"Remove the quantifier if one match is all that is needed.",
				"Change the quantifier if multiple matches are intended.",
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
				onQuantifierEnter(node) {
					if (node.min === 1 && node.max === 1) {
						const quantifierStart = node.element.end;
						context.report({
							data: {
								raw: node.raw,
							},
							fix: {
								range: {
									begin: patternStart + quantifierStart,
									end: patternStart + node.end,
								},
								text: "",
							},
							message: "uselessQuantifier",
							range: {
								begin: patternStart + node.start,
								end: patternStart + node.end,
							},
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
