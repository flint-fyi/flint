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

interface CharacterInfo {
	end: number;
	raw: string;
	start: number;
	value: number;
}

function collectSurrogatePairIndices(characters: CharacterInfo[]) {
	const surrogateIndices = new Set<number>();

	for (let index = 0; index < characters.length - 1; index++) {
		// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
		const current = characters[index]!;
		// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
		const next = characters[index + 1]!;

		if (
			isFourDigitUnicodeEscape(current.raw) &&
			isFourDigitUnicodeEscape(next.raw) &&
			isHighSurrogate(current.value) &&
			isLowSurrogate(next.value) &&
			current.end === next.start
		) {
			surrogateIndices.add(index);
			surrogateIndices.add(index + 1);
		}
	}

	return surrogateIndices;
}

function isFourDigitUnicodeEscape(raw: string) {
	return /^\\u[0-9a-f]{4}$/i.test(raw);
}

function isHighSurrogate(codePoint: number) {
	return codePoint >= 0xd800 && codePoint <= 0xdbff;
}

function isLowSurrogate(codePoint: number) {
	return codePoint >= 0xdc00 && codePoint <= 0xdfff;
}

export default ruleCreator.createRule(typescriptLanguage, {
	about: {
		description:
			"Enforces consistent Unicode escape style in regex patterns by preferring codepoint escapes.",
		id: "regexUnicodeEscapes",
	},
	messages: {
		preferCodepointEscape: {
			primary:
				"Prefer the Unicode codepoint escape '{{ replacement }}' instead of 4-digit escape '{{ raw }}'.",
			secondary: [
				"The \\u{...} format is more flexible, readable, and consistent with modern Unicode handling in JavaScript.",
			],
			suggestions: ["Replace `{{ raw }}` with `{{ replacement }}`."],
		},
	},
	setup(context) {
		function checkPattern(
			pattern: string,
			patternStart: number,
			flags: string,
			canFix: boolean,
		) {
			if (!flags.includes("u") && !flags.includes("v")) {
				return;
			}

			const regexpAst = parseRegexpAst(pattern, flags);
			if (!regexpAst) {
				return;
			}

			const characters: CharacterInfo[] = [];

			visitRegExpAST(regexpAst, {
				onCharacterEnter(charNode: RegExpAST.Character) {
					if (isFourDigitUnicodeEscape(charNode.raw)) {
						characters.push({
							end: charNode.end,
							raw: charNode.raw,
							start: charNode.start,
							value: charNode.value,
						});
					}
				},
			});

			const surrogateIndices = collectSurrogatePairIndices(characters);

			for (let index = 0; index < characters.length; index++) {
				if (surrogateIndices.has(index)) {
					continue;
				}

				// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
				const charInfo = characters[index]!;

				const replacement = `\\u{${charInfo.raw.slice(2)}}`;

				context.report({
					data: {
						raw: charInfo.raw,
						replacement,
					},
					fix: canFix
						? {
								range: {
									begin: patternStart + charInfo.start,
									end: patternStart + charInfo.end,
								},
								text: replacement,
							}
						: undefined,
					message: "preferCodepointEscape",
					range: {
						begin: patternStart + charInfo.start,
						end: patternStart + charInfo.end,
					},
				});
			}
		}

		function checkRegexLiteral(
			node: AST.RegularExpressionLiteral,
			services: TypeScriptFileServices,
		) {
			const details = getRegExpLiteralDetails(node, services);
			checkPattern(details.pattern, details.start, details.flags, true);
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
				false,
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
