import { visitRegExpAST } from "@eslint-community/regexpp";
import type {
	Character,
	CharacterClassRange,
} from "@eslint-community/regexpp/ast";
import {
	type AST,
	type TypeScriptFileServices,
	typescriptLanguage,
} from "@flint.fyi/typescript-language";

import { ruleCreator } from "./ruleCreator.ts";
import { getRegExpConstruction } from "./utils/getRegExpConstruction.ts";
import { getRegExpLiteralDetails } from "./utils/getRegExpLiteralDetails.ts";
import { parseRegexpAst } from "./utils/parseRegexpAst.ts";

type EscapeSequenceKind =
	| "control"
	| "hexadecimal"
	| "none"
	| "unicode"
	| "unicodeCodePoint";

interface Issue {
	data: {
		area: string;
		caseActual: string;
		casePreferred: string;
		lettersActual: string;
		lettersPreferred: string;
	};
	end: number;
	message: "unexpectedCase";
	start: number;
}

function checkPattern(pattern: string, flags: string): Issue[] {
	const regexpAst = parseRegexpAst(pattern, flags);
	if (!regexpAst) {
		return [];
	}

	const issues: Issue[] = [];
	const ignoreCase = flags.includes("i");

	function checkCaseInsensitive(charNode: Character) {
		if (
			charNode.parent.type === "CharacterClassRange" ||
			!isLetter(charNode.value)
		) {
			return;
		}

		const characterValue = String.fromCodePoint(charNode.value);
		if (isLowercaseLetter(characterValue)) {
			return;
		}

		const lowercase = String.fromCodePoint(charNode.value).toLowerCase();

		issues.push({
			data: {
				area: "characters",
				caseActual: "uppercase",
				casePreferred: "lowercase",
				lettersActual: charNode.raw,
				lettersPreferred: lowercase,
			},
			end: charNode.end,
			message: "unexpectedCase",
			start: charNode.start,
		});
	}

	function checkCharacterClassRangeCaseInsensitive(
		rangeNode: CharacterClassRange,
	) {
		if (!isLetter(rangeNode.min.value) || !isLetter(rangeNode.max.value)) {
			return;
		}

		const lowercaseMin = String.fromCodePoint(rangeNode.min.value);
		if (isLowercaseLetter(lowercaseMin)) {
			return;
		}

		const lowercaseMax = String.fromCodePoint(rangeNode.max.value);
		if (isLowercaseLetter(lowercaseMax)) {
			return;
		}

		issues.push({
			data: {
				area: "character class ranges",
				caseActual: "uppercase",
				casePreferred: "lowercase",
				lettersActual: rangeNode.raw,
				lettersPreferred: `${lowercaseMin}-${lowercaseMax}`.toLowerCase(),
			},
			end: rangeNode.end,
			message: "unexpectedCase",
			start: rangeNode.start,
		});
	}

	function checkUnicodeEscape(charNode: Character) {
		const match = /^(\\u\{?)([\dA-Fa-f]+)(\}?)$/u.exec(charNode.raw);
		if (!match) {
			return;
		}

		const [, prefix, code, suffix] = match;
		if (code === code?.toLowerCase()) {
			return;
		}

		issues.push({
			data: {
				area: "unicode escapes",
				caseActual: "uppercase",
				casePreferred: "lowercase",
				lettersActual: charNode.raw,
				lettersPreferred: `${prefix}${code?.toLowerCase()}${suffix}`,
			},
			end: charNode.end,
			message: "unexpectedCase",
			start: charNode.start,
		});
	}

	function checkHexadecimalEscape(charNode: Character) {
		const match = /^\\x([\dA-Fa-f]{2})$/u.exec(charNode.raw);
		if (!match) {
			return;
		}

		// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
		const code = match[1]!;

		if (code === code.toLowerCase()) {
			return;
		}

		issues.push({
			data: {
				area: "hexadecimal escapes",
				caseActual: "uppercase",
				casePreferred: "lowercase",
				lettersActual: charNode.raw,
				lettersPreferred: `\\x${code.toLowerCase()}`,
			},
			end: charNode.end,
			message: "unexpectedCase",
			start: charNode.start,
		});
	}

	function checkControlEscape(charNode: Character) {
		const match = /^\\c([A-Za-z])$/u.exec(charNode.raw);
		if (!match) {
			return;
		}

		// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
		const controlChar = match[1]!;

		if (controlChar === controlChar.toUpperCase()) {
			return;
		}

		issues.push({
			data: {
				area: "control escapes",
				caseActual: "lowercase",
				casePreferred: "uppercase",
				lettersActual: charNode.raw,
				lettersPreferred: `\\c${controlChar.toUpperCase()}`,
			},
			end: charNode.end,
			message: "unexpectedCase",
			start: charNode.start,
		});
	}

	visitRegExpAST(regexpAst, {
		onCharacterClassRangeEnter(rangeNode) {
			if (ignoreCase) {
				checkCharacterClassRangeCaseInsensitive(rangeNode);
			}
		},
		onCharacterEnter(charNode) {
			if (ignoreCase) {
				checkCaseInsensitive(charNode);
			}

			switch (getEscapeSequenceKind(charNode.raw)) {
				case "control": {
					checkControlEscape(charNode);
					break;
				}
				case "hexadecimal": {
					checkHexadecimalEscape(charNode);
					break;
				}

				case "unicode":
				case "unicodeCodePoint": {
					checkUnicodeEscape(charNode);
					break;
				}
			}
		},
	});

	return issues;
}

function getEscapeSequenceKind(raw: string): EscapeSequenceKind {
	if (/^\\u\{[\dA-Fa-f]+\}$/u.test(raw)) {
		return "unicodeCodePoint";
	}

	if (/^\\u[\dA-Fa-f]{4}$/u.test(raw)) {
		return "unicode";
	}

	if (/^\\x[\dA-Fa-f]{2}$/u.test(raw)) {
		return "hexadecimal";
	}

	if (/^\\c[A-Za-z]$/u.test(raw)) {
		return "control";
	}

	return "none";
}

function isLetter(codePoint: number) {
	return /^[a-zA-Z]$/u.test(String.fromCodePoint(codePoint));
}

function isLowercaseLetter(value: string) {
	return /^[a-z]$/u.test(value);
}

export default ruleCreator.createRule(typescriptLanguage, {
	about: {
		description: "Reports inconsistent letter casing in regex sequences.",
		id: "regexLetterCasing",
		presets: ["stylisticStrict"],
	},
	messages: {
		unexpectedCase: {
			primary:
				"Prefer {{ casePreferred }} {{ area }} (`{{ lettersPreferred }}`) rather than {{ caseActual }} (`{{ lettersActual }}`) for consistency.",
			secondary: ["Consistent letter casing in improves readability."],
			suggestions: ["Convert the escape sequence to {{ casePreferred }}."],
		},
	},
	setup(context) {
		function reportIssues(issues: Issue[], patternStart: number) {
			for (const issue of issues) {
				context.report({
					data: issue.data,
					fix: issue.data.lettersPreferred
						? {
								range: {
									begin: patternStart + issue.start,
									end: patternStart + issue.end,
								},
								text: issue.data.lettersPreferred,
							}
						: undefined,
					message: issue.message,
					range: {
						begin: patternStart + issue.start,
						end: patternStart + issue.end,
					},
				});
			}
		}

		function checkRegexLiteral(
			node: AST.RegularExpressionLiteral,
			services: TypeScriptFileServices,
		) {
			const { flags, pattern, start } = getRegExpLiteralDetails(node, services);
			reportIssues(checkPattern(pattern, flags), start);
		}

		function checkRegExpConstructor(
			node: AST.CallExpression | AST.NewExpression,
			services: TypeScriptFileServices,
		) {
			const construction = getRegExpConstruction(node, services);
			if (!construction) {
				return;
			}

			const issues = checkPattern(construction.pattern, construction.flags);
			reportIssues(issues, construction.start + 1);
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
