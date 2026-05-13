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

function simplifyCharacterClass(
	pattern: string,
	charClass: RegExpAST.CharacterClass,
): string {
	const elements = charClass.elements;
	const keptCharacters = new Set<number>();
	const rangesToKeep: { max: number; min: number }[] = [];

	// First pass: collect all characters that should be kept (lowercase versions)
	for (const element of elements) {
		if (element.type === "Character") {
			if (isLetter(element.value)) {
				// Keep lowercase version
				keptCharacters.add(toLowerCase(element.value));
			} else {
				// Keep non-letters as-is
				keptCharacters.add(element.value);
			}
		} else if (element.type === "CharacterClassRange") {
			const min = element.min.value;
			const max = element.max.value;

			// Handle ranges that span letters
			const minIsUpper = min >= 0x41 && min <= 0x5a; // A-Z
			const maxIsUpper = max >= 0x41 && max <= 0x5a;
			const minIsLower = min >= 0x61 && min <= 0x7a; // a-z
			const maxIsLower = max >= 0x61 && max <= 0x7a;

			// If it's an uppercase letter range, convert to lowercase
			if (minIsUpper && maxIsUpper) {
				rangesToKeep.push({
					max: toLowerCase(max),
					min: toLowerCase(min),
				});
			} else if (minIsLower && maxIsLower) {
				// Already lowercase, keep as-is
				rangesToKeep.push({ max, min });
			} else {
				// Mixed or non-letter range, keep as-is
				rangesToKeep.push({ max, min });
			}
		}
	}

	// Build the simplified character class
	let result = "[";

	// Add ranges first
	for (const range of rangesToKeep) {
		result += String.fromCodePoint(range.min);
		result += "-";
		result += String.fromCodePoint(range.max);
	}

	// Add individual characters
	for (const char of [...keptCharacters].sort((a, b) => a - b)) {
		result += String.fromCodePoint(char);
	}

	result += "]";

	// Replace the character class in the original pattern
	const before = pattern.slice(0, charClass.start);
	const after = pattern.slice(charClass.end);

	return before + result + after;
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

					// Simplify all character classes and add the i flag
					let simplifiedPattern = pattern;
					// Process in reverse order to preserve offsets
					for (const charClass of [...characterClasses].reverse()) {
						simplifiedPattern = simplifyCharacterClass(
							simplifiedPattern,
							charClass,
						);
					}
					const fixedText = `/${simplifiedPattern}/${flags}i`;

					for (const charClass of characterClasses) {
						context.report({
							fix: {
								range: nodeRange,
								text: fixedText,
							},
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
