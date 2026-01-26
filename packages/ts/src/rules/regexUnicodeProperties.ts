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

function getExplicitKey(raw: string) {
	const match = /^\\p\{([^=]+)=/i.exec(raw);
	return match ? match[1] : null;
}

function hasExplicitGeneralCategoryKey(raw: string) {
	const match = /^\\p\{([^=]+)=/i.exec(raw);
	if (!match) {
		return false;
	}
	const key = match[1];
	const lower = key.toLowerCase().replace(/_/g, "");
	return lower === "gc" || lower === "generalcategory";
}

function isScriptKey(key: string) {
	const lower = key.toLowerCase().replace(/_/g, "");
	return (
		lower === "sc" ||
		lower === "script" ||
		lower === "scx" ||
		lower === "scriptextensions"
	);
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
			primary: "Remove unnecessary '{{ key }}=' prefix from Unicode property.",
			secondary: [
				"The General_Category prefix is not needed for this property.",
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

			visitRegExpAST(regexpAst, {
				onCharacterSetEnter(characterSet: RegExpAST.CharacterSet) {
					if (characterSet.kind !== "property") {
						return;
					}
					if (characterSet.value === null) {
						return;
					}

					const value = characterSet.value;
					const raw = characterSet.raw;

					if (hasExplicitGeneralCategoryKey(raw)) {
						const explicitKey = getExplicitKey(raw);
						const open = characterSet.negate ? "\\P{" : "\\p{";
						const replacement = `${open}${value}}`;
						const sourceEnd = isStringPattern
							? characterSet.end + 1
							: characterSet.end;

						context.report({
							data: {
								key: explicitKey,
								original: raw,
								replacement,
							},
							fix: {
								range: {
									begin: patternStart + characterSet.start,
									end: patternStart + sourceEnd,
								},
								text: isStringPattern
									? replacement.replace(/\\/g, "\\\\")
									: replacement,
							},
							message: "unnecessaryPrefix",
							range: {
								begin: patternStart + characterSet.start,
								end: patternStart + characterSet.end,
							},
						});
						return;
					}

					const explicitKey = getExplicitKey(raw);
					if (explicitKey && isScriptKey(explicitKey)) {
						const longName = scriptShortToLong[value];
						if (longName) {
							const open = characterSet.negate ? "\\P{" : "\\p{";
							const replacement = `${open}${explicitKey}=${longName}}`;
							const sourceEnd = isStringPattern
								? characterSet.end + 1
								: characterSet.end;

							context.report({
								data: {
									longName,
									shortName: value,
								},
								fix: {
									range: {
										begin: patternStart + characterSet.start,
										end: patternStart + sourceEnd,
									},
									text: isStringPattern
										? replacement.replace(/\\/g, "\\\\")
										: replacement,
								},
								message: "preferLongScript",
								range: {
									begin: patternStart + characterSet.start,
									end: patternStart + characterSet.end,
								},
							});
						}
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
