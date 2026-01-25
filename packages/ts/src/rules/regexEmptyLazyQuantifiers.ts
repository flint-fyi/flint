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

function* extractLazyEndQuantifiers(
	alternatives: RegExpAST.Alternative[],
): IterableIterator<RegExpAST.Quantifier> {
	for (const { elements } of alternatives) {
		if (elements.length === 0) {
			continue;
		}

		const last = elements.at(-1);
		if (!last) {
			continue;
		}

		switch (last.type) {
			case "CapturingGroup":
			case "Group":
				yield* extractLazyEndQuantifiers(last.alternatives);
				break;
			case "Quantifier":
				if (!last.greedy && last.min !== last.max) {
					yield last;
				} else if (last.max === 1) {
					const element = last.element;
					if (element.type === "Group" || element.type === "CapturingGroup") {
						yield* extractLazyEndQuantifiers(element.alternatives);
					}
				}
				break;
			default:
				break;
		}
	}
}

export default ruleCreator.createRule(typescriptLanguage, {
	about: {
		description: "Reports lazy quantifiers at the end of regular expressions.",
		id: "regexEmptyLazyQuantifiers",
		presets: ["logical"],
	},
	messages: {
		uselessElement: {
			primary:
				"Lazy quantifier '{{ raw }}' at end of pattern will only match the empty string.",
			secondary: [
				"Lazy quantifiers at the end of a pattern with minimum 0 will match nothing because there's nothing after them to satisfy.",
			],
			suggestions: [
				"Remove the lazy quantifier.",
				"Add characters after the lazy quantifier to make it useful.",
			],
		},
		uselessQuantifier: {
			primary:
				"Lazy quantifier '{{ raw }}' at end of pattern will always match exactly once.",
			secondary: [
				"Lazy quantifiers at the end of a pattern with minimum 1 will match exactly once because there's nothing after them to satisfy.",
			],
			suggestions: [
				"Remove the lazy quantifier.",
				"Add characters after the lazy quantifier to make it useful.",
			],
		},
		uselessRange: {
			primary:
				"Lazy quantifier '{{ raw }}' at end of pattern will always match exactly {{ min }} times.",
			secondary: [
				"Lazy quantifiers at the end of a pattern will match only their minimum because there's nothing after them to satisfy.",
			],
			suggestions: [
				"Remove the lazy quantifier.",
				"Add characters after the lazy quantifier to make it useful.",
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
				onPatternEnter(patternNode) {
					for (const lazy of extractLazyEndQuantifiers(
						patternNode.alternatives,
					)) {
						const messageId =
							lazy.min === 0
								? "uselessElement"
								: lazy.min === 1
									? "uselessQuantifier"
									: "uselessRange";

						context.report({
							data: {
								min: lazy.min,
								raw: lazy.raw,
							},
							message: messageId,
							range: {
								begin: patternStart + lazy.start,
								end: patternStart + lazy.end,
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
