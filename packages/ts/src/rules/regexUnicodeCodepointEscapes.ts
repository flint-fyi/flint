import { visitRegExpAST } from "@eslint-community/regexpp";
import { typescriptLanguage } from "@flint.fyi/typescript-language";
import type { AST } from "@flint.fyi/typescript-language";
import * as ts from "typescript";

import { ruleCreator } from "./ruleCreator.ts";
import { parseRegexpAst } from "./utils/parseRegexpAst.ts";

function isSurrogatePairEscape(raw: string) {
	return /^(?:\\u[\dA-Fa-f]{4}){2}$/.test(raw);
}

export default ruleCreator.createRule(typescriptLanguage, {
	about: {
		description:
			"Reports surrogate pair escapes in regular expressions that can be replaced with Unicode codepoint escapes.",
		id: "regexUnicodeCodepointEscapes",
		presets: ["stylistic"],
	},
	messages: {
		useSurrogatePair: {
			primary:
				"Use Unicode codepoint escape `{{ replacement }}` instead of surrogate pair `{{ raw }}`.",
			secondary: [
				"Unicode codepoint escapes are clearer and more maintainable than surrogate pairs.",
			],
			suggestions: ["Replace `{{ raw }}` with `{{ replacement }}`."],
		},
	},
	setup(context) {
		function checkPattern(
			pattern: string,
			patternStart: number,
			flags: string,
		) {
			if (!flags.includes("u") && !flags.includes("v")) {
				return;
			}

			const regexpAst = parseRegexpAst(pattern, flags);
			if (!regexpAst) {
				return;
			}

			visitRegExpAST(regexpAst, {
				onCharacterEnter(charNode) {
					if (charNode.value < 0x10000) {
						return;
					}

					if (!isSurrogatePairEscape(charNode.raw)) {
						return;
					}

					let hex = charNode.value.toString(16);
					if (/[A-F]/.test(charNode.raw)) {
						hex = hex.toUpperCase();
					}

					const fixText = `\\u{${hex}}`;
					const displayReplacement = `\\u{${hex}}`;

					context.report({
						data: {
							raw: charNode.raw,
							replacement: displayReplacement,
						},
						fix: {
							range: {
								begin: patternStart + charNode.start,
								end: patternStart + charNode.end,
							},
							text: fixText,
						},
						message: "useSurrogatePair",
						range: {
							begin: patternStart + charNode.start,
							end: patternStart + charNode.end,
						},
					});
				},
			});
		}

		function checkStringPattern(
			rawPattern: string,
			patternStart: number,
			flags: string,
		) {
			if (!flags.includes("u") && !flags.includes("v")) {
				return;
			}

			const surrogatePairPattern = /\\\\u([\dA-Fa-f]{4})\\\\u([\dA-Fa-f]{4})/g;

			let match: null | RegExpExecArray;
			while ((match = surrogatePairPattern.exec(rawPattern)) !== null) {
				const [fullMatch, highHex, lowHex] = match;
				if (!highHex || !lowHex) {
					continue;
				}

				const high = parseInt(highHex, 16);
				const low = parseInt(lowHex, 16);

				if (high < 0xd800 || high > 0xdbff || low < 0xdc00 || low > 0xdfff) {
					continue;
				}

				const codepoint = (high - 0xd800) * 0x400 + (low - 0xdc00) + 0x10000;

				let hex = codepoint.toString(16);
				if (/[A-F]/.test(fullMatch)) {
					hex = hex.toUpperCase();
				}

				const raw = `\\u${highHex}\\u${lowHex}`;
				const fixText = `\\\\u{${hex}}`;
				const displayReplacement = `\\u{${hex}}`;

				context.report({
					data: {
						raw,
						replacement: displayReplacement,
					},
					fix: {
						range: {
							begin: patternStart + match.index,
							end: patternStart + match.index + match[0].length,
						},
						text: fixText,
					},
					message: "useSurrogatePair",
					range: {
						begin: patternStart + match.index,
						end: patternStart + match.index + match[0].length,
					},
				});
			}
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
			checkPattern(pattern, nodeStart + 1, flags ?? "");
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
			const rawPattern = firstArgument.getText(sourceFile).slice(1, -1);

			let flags = "";
			const secondArgument = args[1];
			if (secondArgument?.kind === ts.SyntaxKind.StringLiteral) {
				flags = secondArgument.text;
			}

			checkStringPattern(rawPattern, patternStart, flags);
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
