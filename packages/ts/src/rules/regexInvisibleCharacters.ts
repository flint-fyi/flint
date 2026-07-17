import { visitRegExpAST } from "@eslint-community/regexpp";
import type { Character } from "@eslint-community/regexpp/ast";
import { Chars } from "regexp-ast-analysis";

import {
	typescriptLanguage,
	type AST,
	type TypeScriptFileServices,
} from "@flint.fyi/typescript-language";

import { ruleCreator } from "./ruleCreator.ts";
import { getRegExpConstruction } from "./utils/getRegExpConstruction.ts";
import { getRegExpLiteralDetails } from "./utils/getRegExpLiteralDetails.ts";
import { parseRegexpAst } from "./utils/parseRegexpAst.ts";

const codepoints = {
	braillePatternBlank: 0x28_00,
	leftToRight: 0x20_0e,
	mongolianVowelSeparator: 0x18_0e,
	nextLine: 0x00_85,
	rightToLeft: 0x20_0f,
	space: 0x00_20,
	zeroWidthNonJoiner: 0x20_0c,
	zeroWidthSpace: 0x20_0b,
	zeroWithJoiner: 0x20_0d,
};

function isInvisible(codePoint: number): boolean {
	if (isSpace(codePoint)) {
		return true;
	}
	return (
		codePoint === codepoints.space ||
		codePoint === codepoints.nextLine ||
		codePoint === codepoints.mongolianVowelSeparator ||
		codePoint === codepoints.zeroWidthSpace ||
		codePoint === codepoints.zeroWidthNonJoiner ||
		codePoint === codepoints.zeroWithJoiner ||
		codePoint === codepoints.leftToRight ||
		codePoint === codepoints.rightToLeft ||
		codePoint === codepoints.braillePatternBlank
	);
}

function isSpace(codePoint: number): boolean {
	return Chars.space({}).has(codePoint);
}

function toEscapeSequence(codePoint: number, hasUnicode: boolean): string {
	if (codePoint <= 0xff) {
		return String.raw`\x${codePoint.toString(16).toUpperCase().padStart(2, "0")}`;
	}

	if (hasUnicode) {
		return String.raw`\u{${codePoint.toString(16).toUpperCase()}}`;
	}

	return String.raw`\u${codePoint.toString(16).toUpperCase().padStart(4, "0")}`;
}

export default ruleCreator.createRule(typescriptLanguage, {
	about: {
		description:
			"Reports invisible characters in regex patterns that should use escape sequences instead.",
		id: "regexInvisibleCharacters",
		presets: ["logical", "logicalStrict"],
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
			if (
				charNode.raw.length !== 1 ||
				charNode.value === codepoints.space ||
				!isInvisible(charNode.value)
			) {
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
			services: TypeScriptFileServices,
		) {
			const { flags, pattern, start } = getRegExpLiteralDetails(node, services);
			checkPattern(pattern, start, flags);
		}

		function checkRegExpConstructor(
			node: AST.CallExpression | AST.NewExpression,
			services: TypeScriptFileServices,
		) {
			const construction = getRegExpConstruction(node, services);
			if (!construction) {
				return;
			}

			const patternEscaped = construction.pattern.replaceAll("\\\\", "\\");
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
