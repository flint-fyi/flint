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

function hasTrailingEmptyAlternative(group: RegExpAST.Group) {
	if (group.alternatives.length < 2) {
		return false;
	}

	// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
	const lastAlternative = group.alternatives.at(-1)!;

	return lastAlternative.elements.length === 0;
}

function isGroupQuantified(group: RegExpAST.Group) {
	const parent = group.parent;
	return parent.type === "Quantifier" && parent.element === group;
}

export default ruleCreator.createRule(typescriptLanguage, {
	about: {
		description:
			"Reports quantifiers `{0,1}` in regular expressions that should use `?` instead.",
		id: "regexQuestionQuantifiers",
		presets: ["stylisticStrict"],
	},
	messages: {
		preferOptionalGroup: {
			primary:
				"Prefer optional group syntax using `?` instead of a trailing empty alternative.",
			secondary: [
				"Using `(?:...)?` is clearer than using an empty alternative `(?:...|)`.",
			],
			suggestions: [
				"Remove the trailing empty alternative and add `?` quantifier.",
			],
		},
		preferQuestion: {
			primary:
				"Prefer the more succinct `?` quantifier instead of '{{ quantifier }}'.",
			secondary: [
				"The `?` quantifier is a more concise way to express matching zero or one of the preceding element.",
			],
			suggestions: ["Replace '{{ quantifier }}' with `?`."],
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
				onGroupEnter(group) {
					if (!hasTrailingEmptyAlternative(group) || isGroupQuantified(group)) {
						return;
					}

					// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
					const secondToLastAlternative = group.alternatives.at(-2)!;

					const removeStart = secondToLastAlternative.end - group.start;
					const removeEnd = group.end - group.start;

					context.report({
						fix: {
							range: {
								begin: patternStart + group.start + removeStart,
								end: patternStart + group.start + removeEnd,
							},
							text: ")?",
						},
						message: "preferOptionalGroup",
						range: {
							begin: patternStart + group.start,
							end: patternStart + group.end,
						},
					});
				},
				onQuantifierEnter(quantifier) {
					if (quantifier.min !== 0 || quantifier.max !== 1) {
						return;
					}

					const [startOffset, endOffset] = getQuantifierOffsets(quantifier);
					const quantifierText = quantifier.raw.slice(startOffset, endOffset);

					if (quantifierText === "?") {
						return;
					}

					const replacement = quantifier.greedy ? "?" : "??";

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
						message: "preferQuestion",
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
