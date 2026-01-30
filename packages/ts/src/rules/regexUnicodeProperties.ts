import {
	type AST as RegExpAST,
	visitRegExpAST,
} from "@eslint-community/regexpp";
import type { ReportInterpolationData } from "@flint.fyi/core";
import { typescriptLanguage } from "@flint.fyi/typescript-language";
import type {
	AST,
	TypeScriptFileServices,
} from "@flint.fyi/typescript-language";

import { ruleCreator } from "./ruleCreator.ts";
import { getRegExpConstruction } from "./utils/getRegExpConstruction.ts";
import { getRegExpLiteralDetails } from "./utils/getRegExpLiteralDetails.ts";
import { parseRegexpAst } from "./utils/parseRegexpAst.ts";

type CharacterSetWithValue = RegExpAST.CharacterUnicodePropertyCharacterSet & {
	kind: "property";
	value: string;
};

function isPropertyCharacterSetWithValue(
	characterSet: RegExpAST.CharacterSet,
): characterSet is CharacterSetWithValue {
	return characterSet.kind === "property" && !!characterSet.value;
}

/* spellchecker:disable */
const scriptShortToLong: Record<string, string> = {
	Arab: "Arabic",
	Armn: "Armenian",
	Beng: "Bengali",
	Cyrl: "Cyrillic",
	Deva: "Devanagari",
	Geor: "Georgian",
	Grek: "Greek",
	Gujr: "Gujarati",
	Guru: "Gurmukhi",
	Hang: "Hangul",
	Hani: "Han",
	Hebr: "Hebrew",
	Hira: "Hiragana",
	Kana: "Katakana",
	Knda: "Kannada",
	Latn: "Latin",
	Mlym: "Malayalam",
	Mymr: "Myanmar",
	Orya: "Oriya",
	Sinh: "Sinhala",
	Taml: "Tamil",
	Telu: "Telugu",
	Thai: "Thai",
	Tibt: "Tibetan",
	Zinh: "Inherited",
	Zyyy: "Common",
	Zzzz: "Unknown",
};
/* spellchecker:enable */

function getExplicitKey(raw: string) {
	const match = /^\\p\{([^=]+)=/i.exec(raw);
	return match ? match[1] : null;
}

function hasCategoryKey(explicitKey: string) {
	const lower = explicitKey.toLowerCase().replace(/_/g, "");
	return lower === "gc" || lower === "generalcategory";
}

export default ruleCreator.createRule(typescriptLanguage, {
	about: {
		description:
			"Reports inconsistent Unicode property names in regular expressions.",
		id: "regexUnicodeProperties",
		presets: ["stylistic"],
	},
	messages: {
		preferLongScript: {
			primary:
				"Use long Script property name '{{ longName }}' instead of '{{ shortName }}'.",
			secondary: ["Long Script names are more readable and explicit."],
			suggestions: ["Replace '{{ shortName }}' with '{{ longName }}'."],
		},
		unnecessaryPrefix: {
			primary:
				"The '{{ key }}=' prefix is unnecessary for this Unicode property.",
			secondary: [
				"Unicode properties may be expressed in several different ways.",
				"Including the fully-written out category prefix is a more verbose way that is not necessary.",
			],
			suggestions: ["Replace '{{ original }}' with '{{ replacement }}'."],
		},
	},
	setup(context) {
		function checkPattern(
			pattern: string,
			patternStart: number,
			flags: string,
			isStringPattern: boolean,
		) {
			if (!flags.includes("u") && !flags.includes("v")) {
				return;
			}

			const regexpAst = parseRegexpAst(pattern, flags);
			if (!regexpAst) {
				return;
			}

			function reportOn(
				characterSet: RegExpAST.CharacterUnicodePropertyCharacterSet,
				data: ReportInterpolationData,
				replacement: string,
				message: "preferLongScript" | "unnecessaryPrefix",
			) {
				const sourceEnd = isStringPattern
					? characterSet.end + 1
					: characterSet.end;

				context.report({
					data,
					fix: {
						range: {
							begin: patternStart + characterSet.start,
							end: patternStart + sourceEnd,
						},
						text: isStringPattern
							? replacement.replace(/\\/g, "\\\\")
							: replacement,
					},
					message,
					range: {
						begin: patternStart + characterSet.start,
						end: patternStart + characterSet.end,
					},
				});
			}

			function reportOnCategoryKey(
				characterSet: CharacterSetWithValue,
				explicitKey: string,
			) {
				const open = characterSet.negate ? "\\P{" : "\\p{";
				const replacement = `${open}${characterSet.value}}`;
				reportOn(
					characterSet,
					{
						key: explicitKey,
						original: characterSet.raw,
						replacement,
					},
					replacement,
					"unnecessaryPrefix",
				);
			}

			function reportOnScriptKey(
				characterSet: CharacterSetWithValue,
				explicitKey: string,
			) {
				const longName = scriptShortToLong[characterSet.value];
				if (!longName) {
					return;
				}

				const open = characterSet.negate ? "\\P{" : "\\p{";
				const replacement = `${open}${explicitKey}=${longName}}`;
				reportOn(
					characterSet,
					{
						longName,
						shortName: characterSet.value,
					},
					replacement,
					"preferLongScript",
				);
			}

			visitRegExpAST(regexpAst, {
				onCharacterSetEnter(characterSet: RegExpAST.CharacterSet) {
					if (!isPropertyCharacterSetWithValue(characterSet)) {
						return;
					}

					const explicitKey = getExplicitKey(characterSet.raw);
					if (!explicitKey) {
						return;
					}

					if (hasCategoryKey(explicitKey)) {
						reportOnCategoryKey(characterSet, explicitKey);
					} else {
						reportOnScriptKey(characterSet, explicitKey);
					}
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
