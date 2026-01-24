import { visitRegExpAST } from "@eslint-community/regexpp";
import type { Character } from "@eslint-community/regexpp/ast";
import {
	getTSNodeRange,
	typescriptLanguage,
} from "@flint.fyi/typescript-language";
import type {
	AST,
	TypeScriptFileServices,
} from "@flint.fyi/typescript-language";
import { Chars } from "regexp-ast-analysis";

import { ruleCreator } from "./ruleCreator.ts";
import { getRegExpConstruction } from "./utils/getRegExpConstruction.ts";
import { parseRegexpAst } from "./utils/parseRegexpAst.ts";

const CP_SPACE = 0x0020;
const CP_NEL = 0x0085;
const CP_MONGOLIAN_VOWEL_SEPARATOR = 0x180e;
const CP_ZWSP = 0x200b;
const CP_ZWNJ = 0x200c;
const CP_ZWJ = 0x200d;
const CP_LRM = 0x200e;
const CP_RLM = 0x200f;
const CP_BRAILLE_PATTERN_BLANK = 0x2800;

function isInvisible(codePoint: number): boolean {
	if (isSpace(codePoint)) {
		return true;
	}
	return (
		codePoint === CP_MONGOLIAN_VOWEL_SEPARATOR ||
		codePoint === CP_NEL ||
		codePoint === CP_ZWSP ||
		codePoint === CP_ZWNJ ||
		codePoint === CP_ZWJ ||
		codePoint === CP_LRM ||
		codePoint === CP_RLM ||
		codePoint === CP_BRAILLE_PATTERN_BLANK
	);
}

function isSpace(codePoint: number): boolean {
	return Chars.space({}).has(codePoint);
}

function toEscapeSequence(codePoint: number, hasUnicode: boolean): string {
	if (codePoint <= 0xff) {
		return `\\x${codePoint.toString(16).toUpperCase().padStart(2, "0")}`;
	}

	if (hasUnicode) {
		return `\\u{${codePoint.toString(16).toUpperCase()}}`;
	}

	return `\\u${codePoint.toString(16).toUpperCase().padStart(4, "0")}`;
}

export default ruleCreator.createRule(typescriptLanguage, {
	about: {
		description:
			"Reports invisible characters in regex patterns that should use escape sequences instead.",
		id: "regexInvisibleCharacters",
		presets: ["logical"],
	},
	messages: {
		unexpectedInvisible: {
			primary:
				"Prefer the more clear '{{ escape }}' instead of this invisible character.",
			secondary: [
				"Invisible characters are difficult to distinguish and can lead to hard-to-debug issues.",
			],
			suggestions: ["Replace the invisible character with '{{ escape }}'."],
		},
	},
	setup(context) {
		function checkCharacter(
			charNode: Character,
			patternStart: number,
			hasUnicode: boolean,
		) {
			if (charNode.value === CP_SPACE) {
				return;
			}

			if (charNode.raw.length !== 1) {
				return;
			}

			if (!isInvisible(charNode.value)) {
				return;
			}

			const escape = toEscapeSequence(charNode.value, hasUnicode);

			context.report({
				data: { escape },
				fix: {
					range: {
						begin: patternStart + charNode.start,
						end: patternStart + charNode.end,
					},
					text: escape,
				},
				message: "unexpectedInvisible",
				range: {
					begin: patternStart + charNode.start,
					end: patternStart + charNode.end,
				},
			});
		}

		function checkPattern(
			pattern: string,
			patternStart: number,
			flags: string,
		) {
			const regexpAst = parseRegexpAst(pattern, flags);
			if (!regexpAst) {
				return;
			}

			const hasUnicode = flags.includes("u") || flags.includes("v");

			visitRegExpAST(regexpAst, {
				onCharacterEnter(charNode) {
					checkCharacter(charNode, patternStart, hasUnicode);
				},
			});
		}

		function checkRegexLiteral(
			node: AST.RegularExpressionLiteral,
			{ sourceFile }: TypeScriptFileServices,
		) {
			const text = node.getText(sourceFile);
			const match = /^\/(.+)\/([dgimsuyv]*)$/.exec(text);
			if (!match) {
				return;
			}

			const [, pattern, flags] = match;
			if (!pattern) {
				return;
			}

			const nodeRange = getTSNodeRange(node, sourceFile);
			checkPattern(pattern, nodeRange.begin + 1, flags ?? "");
		}

		function checkRegExpConstructor(
			node: AST.CallExpression | AST.NewExpression,
			services: TypeScriptFileServices,
		) {
			const construction = getRegExpConstruction(node, services);
			if (!construction) {
				return;
			}

			const patternEscaped = construction.pattern.replace(/\\\\/g, "\\");
			checkPattern(patternEscaped, construction.start + 1, construction.flags);
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
