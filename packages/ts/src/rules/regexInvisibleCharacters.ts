import {
	type AST as RegExpAST,
	visitRegExpAST,
} from "@eslint-community/regexpp";
import {
	getTSNodeRange,
	typescriptLanguage,
} from "@flint.fyi/typescript-language";

import { ruleCreator } from "./ruleCreator.ts";
import { parseRegexpAst } from "./utils/parseRegexpAst.ts";

const INVISIBLE_CODE_POINTS = new Set([
	0x0009, // Tab
	0x000a, // Line Feed
	0x000b, // Vertical Tab
	0x000c, // Form Feed
	0x000d, // Carriage Return
	0x0020, // Space
	0x0085, // Next Line (NEL)
	0x00a0, // Non-Breaking Space
	0x1680, // Ogham Space Mark
	0x180e, // Mongolian Vowel Separator
	0x2000, // En Quad
	0x2001, // Em Quad
	0x2002, // En Space
	0x2003, // Em Space
	0x2004, // Three-Per-Em Space
	0x2005, // Four-Per-Em Space
	0x2006, // Six-Per-Em Space
	0x2007, // Figure Space
	0x2008, // Punctuation Space
	0x2009, // Thin Space
	0x200a, // Hair Space
	0x200b, // Zero Width Space
	0x200c, // Zero Width Non-Joiner
	0x200d, // Zero Width Joiner
	0x200e, // Left-to-Right Mark
	0x200f, // Right-to-Left Mark
	0x2028, // Line Separator
	0x2029, // Paragraph Separator
	0x202f, // Narrow No-Break Space
	0x205f, // Medium Mathematical Space
	0x2800, // Braille Pattern Blank
	0x3000, // Ideographic Space
	0xfeff, // Byte Order Mark
]);

const SPACE_CODE_POINT = 0x0020;

function isInvisible(codePoint: number) {
	return INVISIBLE_CODE_POINTS.has(codePoint);
}

function toEscapeSequence(codePoint: number, hasUnicode: boolean) {
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
			primary: "Unexpected invisible character. Use '{{ escape }}' instead.",
			secondary: [
				"Invisible characters are difficult to distinguish and can lead to hard-to-debug issues.",
			],
			suggestions: ["Replace the invisible character with '{{ escape }}'."],
		},
	},
	setup(context) {
		return {
			visitors: {
				RegularExpressionLiteral: (node, { sourceFile }) => {
					const text = node.getText(sourceFile);
					const match = /^\/(.+)\/([dgimsuyv]*)$/.exec(text);

					if (!match) {
						return;
					}

					const [, pattern, flagsStr] = match;

					if (!pattern) {
						return;
					}

					const hasUnicode =
						(flagsStr?.includes("u") ?? false) ||
						(flagsStr?.includes("v") ?? false);

					const regexpAst = parseRegexpAst(pattern, {
						unicode: flagsStr?.includes("u"),
						unicodeSets: flagsStr?.includes("v"),
					});

					if (!regexpAst) {
						return;
					}

					const nodeRange = getTSNodeRange(node, sourceFile);

					visitRegExpAST(regexpAst, {
						onCharacterEnter(charNode: RegExpAST.Character) {
							if (charNode.value === SPACE_CODE_POINT) {
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
										begin: nodeRange.begin + 1 + charNode.start,
										end: nodeRange.begin + 1 + charNode.end,
									},
									text: escape,
								},
								message: "unexpectedInvisible",
								range: {
									begin: nodeRange.begin + 1 + charNode.start,
									end: nodeRange.begin + 1 + charNode.end,
								},
							});
						},
					});
				},
			},
		};
	},
});
