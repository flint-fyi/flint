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

function isSurrogatePairEscape(raw: string) {
	return /^(?:\\u[\da-f]{4}){2}$/i.test(raw);
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
				"Prefer the more expressive Unicode codepoint escape `{{ replacement }}` instead of surrogate pair `{{ raw }}`.",
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
					if (
						charNode.value < 0x10000 ||
						!isSurrogatePairEscape(charNode.raw)
					) {
						return;
					}

					let hex = charNode.value.toString(16);
					if (/[A-F]/.test(charNode.raw)) {
						hex = hex.toUpperCase();
					}

					const replacement = `\\u{${hex}}`;

					context.report({
						data: {
							raw: charNode.raw,
							replacement,
						},
						fix: {
							range: {
								begin: patternStart + charNode.start,
								end: patternStart + charNode.end,
							},
							text: replacement,
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

			const surrogatePairPattern = /\\\\u([\da-f]{4})\\\\u([\da-f]{4})/gi;

			let match: null | RegExpExecArray;
			while ((match = surrogatePairPattern.exec(rawPattern)) !== null) {
				const [fullMatch, highHex, lowHex] = match;
				if (!highHex || !lowHex) {
					continue;
				}

				const high = parseInt(highHex, 16);
				if (high < 0xd800 || high > 0xdbff) {
					continue;
				}

				const low = parseInt(lowHex, 16);
				if (low < 0xdc00 || low > 0xdfff) {
					continue;
				}

				const codepoint = (high - 0xd800) * 0x400 + (low - 0xdc00) + 0x10000;

				let hex = codepoint.toString(16);
				if (/[A-F]/.test(fullMatch)) {
					hex = hex.toUpperCase();
				}

				const raw = `\\u${highHex}\\u${lowHex}`;
				const displayReplacement = `\\u{${hex}}`;
				const fixText = `\\${displayReplacement}`;

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

			checkStringPattern(
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
