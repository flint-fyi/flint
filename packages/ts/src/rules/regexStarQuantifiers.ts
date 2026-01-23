import {
	type AST as RegExpAST,
	visitRegExpAST,
} from "@eslint-community/regexpp";
import { typescriptLanguage } from "@flint.fyi/typescript-language";
import type { AST } from "@flint.fyi/typescript-language";
import * as ts from "typescript";

import { ruleCreator } from "./ruleCreator.ts";
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
			"Reports quantifiers `{0,}` in regular expressions that should use `*` instead.",
		id: "regexStarQuantifiers",
		presets: ["stylisticStrict"],
	},
	messages: {
		preferStar: {
			primary: "Use '*' quantifier instead of '{{ quantifier }}'.",
			secondary: [
				"The `*` quantifier is a more concise way to express matching zero or more of the preceding element.",
			],
			suggestions: ["Replace '{{ quantifier }}' with '*'."],
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
					if (quantifier.min !== 0 || quantifier.max !== Infinity) {
						return;
					}

					const [startOffset, endOffset] = getQuantifierOffsets(quantifier);
					const quantifierText = quantifier.raw.slice(startOffset, endOffset);

					if (quantifierText === "*") {
						return;
					}

					const replacement = quantifier.greedy ? "*" : "*?";

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
						message: "preferStar",
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
			{ sourceFile }: { sourceFile: ts.SourceFile },
		) {
			const text = node.getText(sourceFile);
			const match = /^\/(.*)\/([dgimsuyv]*)$/.exec(text);

			if (!match) {
				return;
			}

			const [, pattern, flags] = match;

			if (!pattern) {
				return;
			}

			const nodeStart = node.getStart(sourceFile);
			checkPattern(pattern, nodeStart + 1, flags ?? "", false);
		}

		function checkRegExpConstructor(
			node: AST.CallExpression | AST.NewExpression,
			{ sourceFile }: { sourceFile: ts.SourceFile },
		) {
			if (
				node.expression.kind !== ts.SyntaxKind.Identifier ||
				node.expression.text !== "RegExp"
			) {
				return;
			}

			const args = node.arguments;
			if (!args?.length) {
				return;
			}

			const firstArgument = args[0];
			if (
				!firstArgument ||
				firstArgument.kind !== ts.SyntaxKind.StringLiteral
			) {
				return;
			}

			const patternStart = firstArgument.getStart(sourceFile) + 1;

			let flags = "";
			const secondArgument = args[1];
			if (secondArgument?.kind === ts.SyntaxKind.StringLiteral) {
				flags = secondArgument.text;
			}

			checkPattern(firstArgument.text, patternStart, flags, true);
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
