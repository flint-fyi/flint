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

function canUseIgnoreCase(
	pattern: RegExpAST.Pattern,
	hasIgnoreCase: boolean,
): { characterClasses: RegExpAST.CharacterClass[]; simplified: boolean } {
	if (hasIgnoreCase) {
		return { characterClasses: [], simplified: false };
	}

	const characterClasses: RegExpAST.CharacterClass[] = [];
	let simplified = false;

	visitRegExpAST(pattern, {
		onCharacterClassEnter(charClass) {
			if (charClass.negate) {
				return;
			}

			if (hasMatchingCasePair(charClass.elements)) {
				characterClasses.push(charClass);
				simplified = true;
			}
		},
	});

	return { characterClasses, simplified };
}

function hasMatchingCasePair(elements: RegExpAST.CharacterClassElement[]) {
	const letters = new Set<number>();

	for (const element of elements) {
		if (element.type === "Character" && isLetter(element.value)) {
			letters.add(element.value);
		} else if (element.type === "CharacterClassRange") {
			for (let code = element.min.value; code <= element.max.value; code++) {
				if (isLetter(code)) {
					letters.add(code);
				}
			}
		}
	}

	for (const letter of letters) {
		const lower = toLowerCase(letter);
		const upper = toUpperCase(letter);

		if (letters.has(lower) && letters.has(upper)) {
			return true;
		}
	}

	return false;
}

function isLetter(codePoint: number) {
	return (
		(codePoint >= 0x41 && codePoint <= 0x5a) ||
		(codePoint >= 0x61 && codePoint <= 0x7a)
	);
}

function toLowerCase(codePoint: number) {
	if (codePoint >= 0x41 && codePoint <= 0x5a) {
		return codePoint + 0x20;
	}

	return codePoint;
}

function toUpperCase(codePoint: number) {
	if (codePoint >= 0x61 && codePoint <= 0x7a) {
		return codePoint - 0x20;
	}

	return codePoint;
}

export default ruleCreator.createRule(typescriptLanguage, {
	about: {
		description:
			"Reports regex patterns that can be simplified by using the i (ignore case) flag.",
		id: "regexIgnoreCaseFlags",
		presets: ["logical"],
	},
	messages: {
		useIgnoreCase: {
			primary: "This character class can be simplified by using the 'i' flag.",
			secondary: [
				"The 'i' flag makes the regex case-insensitive, eliminating the need to match both upper and lower case letters explicitly.",
			],
			suggestions: ["Add the 'i' flag and simplify the character class."],
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

					const hasIgnoreCase = flagsStr?.includes("i") ?? false;

					if (hasIgnoreCase) {
						return;
					}

					const hasUnicode = flagsStr?.includes("u");
					const hasUnicodeSets = flagsStr?.includes("v");

					const regexpAst = parseRegexpAst(pattern, {
						unicode: hasUnicode,
						unicodeSets: hasUnicodeSets,
					});

					if (!regexpAst) {
						return;
					}

					const { characterClasses, simplified } = canUseIgnoreCase(
						regexpAst,
						hasIgnoreCase,
					);

					if (!simplified) {
						return;
					}

					const nodeRange = getTSNodeRange(node, sourceFile);

					for (const charClass of characterClasses) {
						context.report({
							message: "useIgnoreCase",
							range: {
								begin: nodeRange.begin + 1 + charClass.start,
								end: nodeRange.begin + 1 + charClass.end,
							},
						});
					}
				},
			},
		};
	},
});
