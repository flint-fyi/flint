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

function getCharacterClassesIfSimplified(pattern: RegExpAST.Pattern) {
	const characterClasses: RegExpAST.CharacterClass[] = [];
	let simplified = false;

	visitRegExpAST(pattern, {
		onCharacterClassEnter(charClass) {
			if (charClass.negate || simplified) {
				return;
			}

			const elements = charClass.elements;
			if (
				hasMatchingCasePair(elements) &&
				!isHexSubset(elements) &&
				!isFullAlphabetMatch(elements)
			) {
				characterClasses.push(charClass);
				simplified = true;
			}
		},
	});

	// May be set by the function inside visitors
	// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
	return simplified ? characterClasses : undefined;
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

	return letters
		.values()
		.some(
			(letter) =>
				letters.has(toLowerCase(letter)) && letters.has(toUpperCase(letter)),
		);
}

function isFullAlphabetMatch(elements: RegExpAST.CharacterClassElement[]) {
	// Returns true if the class matches exactly [A-Za-z] - intentionally matching any letter
	let hasFullUpper = false;
	let hasFullLower = false;
	let hasOtherLetters = false;

	for (const element of elements) {
		if (element.type === "CharacterClassRange") {
			const min = element.min.value;
			const max = element.max.value;
			if (min === 0x41 && max === 0x5a) {
				hasFullUpper = true;
			} else if (min === 0x61 && max === 0x7a) {
				hasFullLower = true;
			} else if (isLetter(min) || isLetter(max)) {
				hasOtherLetters = true;
			}
		} else if (element.type === "Character" && isLetter(element.value)) {
			hasOtherLetters = true;
		}
	}

	return hasFullUpper && hasFullLower && !hasOtherLetters;
}

function isHexLetter(codePoint: number) {
	return (
		(codePoint >= 0x41 && codePoint <= 0x46) || // A-F
		(codePoint >= 0x61 && codePoint <= 0x66) // a-f
	);
}

function isHexSubset(elements: RegExpAST.CharacterClassElement[]) {
	// Returns true if there is a letter range confined to A-F/a-f
	let hasHexRange = false;
	for (const element of elements) {
		if (element.type === "CharacterClassRange") {
			const min = element.min.value;
			const max = element.max.value;
			const isUpperHexRange = min >= 0x41 && max <= 0x46; // A-F
			const isLowerHexRange = min >= 0x61 && max <= 0x66; // a-f
			if (isUpperHexRange || isLowerHexRange) {
				hasHexRange = true;
			} else if (isLetter(min) || isLetter(max)) {
				// Contains a non-hex letter range
				return false;
			}
		} else if (element.type === "Character") {
			// Individual letters don't qualify as hex subset by themselves
			if (isLetter(element.value) && !isHexLetter(element.value)) {
				return false;
			}
		}
	}
	return hasHexRange;
}

function isLetter(codePoint: number) {
	return (
		(codePoint >= 0x41 && codePoint <= 0x5a) ||
		(codePoint >= 0x61 && codePoint <= 0x7a)
	);
}

function toLowerCase(codePoint: number) {
	return codePoint >= 0x41 && codePoint <= 0x5a ? codePoint + 0x20 : codePoint;
}

function toUpperCase(codePoint: number) {
	return codePoint >= 0x61 && codePoint <= 0x7a ? codePoint - 0x20 : codePoint;
}

export default ruleCreator.createRule(typescriptLanguage, {
	about: {
		description:
			"Reports regex patterns that can be simplified by using the i (ignore case) flag.",
		id: "regexIgnoreCaseFlags",
		presets: ["logical", "logicalStrict"],
	},
	messages: {
		useIgnoreCase: {
			primary: "This character class can be simplified by using the `i` flag.",
			secondary: [
				"The `i` flag makes the regex case-insensitive, eliminating the need to match both upper and lower case letters explicitly.",
			],
			suggestions: [
				"Add the `i` flag and simplify the character class if it is meant to be case-insensitive.",
				"Remove the `i` flag if it is not meant to be case-insensitive.",
			],
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

					const [, pattern, flags] = match;
					if (!pattern || flags?.includes("i")) {
						return;
					}

					const regexpAst = parseRegexpAst(pattern, flags);
					if (!regexpAst) {
						return;
					}

					const characterClasses = getCharacterClassesIfSimplified(regexpAst);
					if (!characterClasses) {
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
