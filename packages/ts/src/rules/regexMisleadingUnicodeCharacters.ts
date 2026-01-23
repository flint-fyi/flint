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

type Character = RegExpAST.Character;
type CharacterClassElement = RegExpAST.CharacterClassElement;

interface Match {
	characters: Character[];
	kind: MatchKind;
}

type MatchKind =
	| "combiningClass"
	| "emojiModifier"
	| "regionalIndicatorSymbol"
	| "surrogatePair"
	| "surrogatePairWithoutUFlag"
	| "zwj";

function findAllMatches(chars: Character[], hasUnicodeFlag: boolean): Match[] {
	const matches: Match[] = [];

	if (hasUnicodeFlag) {
		for (const characters of findSurrogatePair(chars)) {
			matches.push({ characters, kind: "surrogatePair" });
		}
	} else {
		for (const characters of findSurrogatePairWithoutUFlag(chars)) {
			matches.push({ characters, kind: "surrogatePairWithoutUFlag" });
		}
	}

	for (const characters of findCombiningClass(chars)) {
		matches.push({ characters, kind: "combiningClass" });
	}

	for (const characters of findEmojiModifier(chars)) {
		matches.push({ characters, kind: "emojiModifier" });
	}

	for (const characters of findRegionalIndicatorSymbol(chars)) {
		matches.push({ characters, kind: "regionalIndicatorSymbol" });
	}

	for (const characters of findZwj(chars)) {
		matches.push({ characters, kind: "zwj" });
	}

	return matches;
}

function* findCombiningClass(
	chars: Character[],
): IterableIterator<Character[]> {
	for (const [index, char] of chars.entries()) {
		const previous = chars[index - 1];
		if (
			previous &&
			isCombiningCharacter(char.value) &&
			!isCombiningCharacter(previous.value)
		) {
			yield [previous, char];
		}
	}
}

function* findEmojiModifier(chars: Character[]): IterableIterator<Character[]> {
	for (const [index, char] of chars.entries()) {
		const previous = chars[index - 1];
		if (
			previous &&
			isEmojiModifier(char.value) &&
			!isEmojiModifier(previous.value)
		) {
			yield [previous, char];
		}
	}
}

function* findRegionalIndicatorSymbol(
	chars: Character[],
): IterableIterator<Character[]> {
	for (const [index, char] of chars.entries()) {
		const previous = chars[index - 1];
		if (
			previous &&
			isRegionalIndicatorSymbol(char.value) &&
			isRegionalIndicatorSymbol(previous.value)
		) {
			yield [previous, char];
		}
	}
}

function* findSurrogatePair(chars: Character[]): IterableIterator<Character[]> {
	for (const [index, char] of chars.entries()) {
		const previous = chars[index - 1];
		if (
			previous &&
			isSurrogatePair(previous.value, char.value) &&
			(isUnicodeCodePointEscape(previous) || isUnicodeCodePointEscape(char))
		) {
			yield [previous, char];
		}
	}
}

function* findSurrogatePairWithoutUFlag(
	chars: Character[],
): IterableIterator<Character[]> {
	for (const [index, char] of chars.entries()) {
		const previous = chars[index - 1];
		if (
			previous &&
			isSurrogatePair(previous.value, char.value) &&
			!isUnicodeCodePointEscape(previous) &&
			!isUnicodeCodePointEscape(char)
		) {
			yield [previous, char];
		}
	}
}

function* findZwj(chars: Character[]): IterableIterator<Character[]> {
	let sequence: Character[] | undefined;

	for (const [index, char] of chars.entries()) {
		const previous = chars[index - 1];
		const next = chars[index + 1];

		if (
			previous &&
			next &&
			char.value === 0x200d &&
			previous.value !== 0x200d &&
			next.value !== 0x200d
		) {
			if (sequence) {
				if (sequence.at(-1) === previous) {
					sequence.push(char, next);
				} else {
					yield sequence;
					sequence = chars.slice(index - 1, index + 2);
				}
			} else {
				sequence = chars.slice(index - 1, index + 2);
			}
		}
	}

	if (sequence) {
		yield sequence;
	}
}

function getMessageId(kind: MatchKind) {
	switch (kind) {
		case "combiningClass":
			return "combiningClass";
		case "emojiModifier":
			return "emojiModifier";
		case "regionalIndicatorSymbol":
			return "regionalIndicatorSymbol";
		case "surrogatePair":
			return "surrogatePair";
		case "surrogatePairWithoutUFlag":
			return "surrogatePairWithoutUFlag";
		case "zwj":
			return "zwj";
	}
}

function isCombiningCharacter(codePoint: number) {
	return /^[\p{Mc}\p{Me}\p{Mn}]$/u.test(String.fromCodePoint(codePoint));
}

function isEmojiModifier(code: number) {
	return code >= 0x1f3fb && code <= 0x1f3ff;
}

function isRegionalIndicatorSymbol(code: number) {
	return code >= 0x1f1e6 && code <= 0x1f1ff;
}

function isSurrogatePair(lead: number, tail: number) {
	return lead >= 0xd800 && lead < 0xdc00 && tail >= 0xdc00 && tail < 0xe000;
}

function isUnicodeCodePointEscape(char: Character) {
	return /^\\u\{[\da-f]+\}$/iu.test(char.raw);
}

function* iterateCharacterSequence(
	nodes: CharacterClassElement[],
): IterableIterator<Character[]> {
	let sequence: Character[] = [];

	for (const node of nodes) {
		switch (node.type) {
			case "Character":
				sequence.push(node);
				break;
			case "CharacterClass":
			case "CharacterSet":
			case "ClassStringDisjunction":
			case "ExpressionCharacterClass":
				if (sequence.length > 0) {
					yield sequence;
					sequence = [];
				}
				break;
			case "CharacterClassRange":
				sequence.push(node.min);
				yield sequence;
				sequence = [node.max];
				break;
		}
	}

	if (sequence.length > 0) {
		yield sequence;
	}
}

export default ruleCreator.createRule(typescriptLanguage, {
	about: {
		description:
			"Reports characters in regex character classes that appear as single visual characters but are made of multiple code points.",
		id: "regexMisleadingUnicodeCharacters",
		presets: ["logical"],
	},
	messages: {
		combiningClass: {
			primary: "Combined character in character class.",
			secondary: [
				"The base character and combining mark are matched separately, not as a single unit.",
				"Consider using Unicode normalization or matching the composed character.",
			],
			suggestions: [],
		},
		emojiModifier: {
			primary: "Emoji with skin tone modifier in character class.",
			secondary: [
				"The emoji and its modifier are matched separately, not as a single unit.",
				"Consider matching the sequence outside of a character class.",
			],
			suggestions: [],
		},
		regionalIndicatorSymbol: {
			primary: "Regional indicator symbols (flag) in character class.",
			secondary: [
				"The two regional indicator symbols are matched separately, not as a single flag.",
				"Consider matching the flag sequence outside of a character class.",
			],
			suggestions: [],
		},
		surrogatePair: {
			primary: "Surrogate pair in character class.",
			secondary: [
				"The surrogate code points are represented with different escape types.",
				"Use consistent escape sequences for both halves of the pair.",
			],
			suggestions: [],
		},
		surrogatePairWithoutUFlag: {
			primary: "Surrogate pair in character class without the `u` or `v` flag.",
			secondary: [
				"Without the unicode flag, each half of the surrogate pair is matched separately.",
			],
			suggestions: ["Add the `u` flag to the regex."],
		},
		zwj: {
			primary: "Zero-width joiner sequence in character class.",
			secondary: [
				"Characters joined with ZWJ are matched separately, not as a single unit.",
				"Consider matching the sequence outside of a character class.",
			],
			suggestions: [],
		},
	},
	setup(context) {
		return {
			visitors: {
				RegularExpressionLiteral: (node, { sourceFile }) => {
					const match = /^\/(.+)\/([dgimsuyv]*)$/.exec(node.text);
					if (!match) {
						return;
					}

					const [, pattern, flagsStr = ""] = match;
					if (!pattern) {
						return;
					}

					const regexpAst = parseRegexpAst(pattern, flagsStr);
					if (!regexpAst) {
						return;
					}

					const hasUnicodeFlag =
						flagsStr.includes("u") || flagsStr.includes("v");
					const range = getTSNodeRange(node, sourceFile);

					visitRegExpAST(regexpAst, {
						onCharacterClassEnter(ccNode) {
							for (const chars of iterateCharacterSequence(ccNode.elements)) {
								const matches = findAllMatches(chars, hasUnicodeFlag);

								for (const { characters, kind } of matches) {
									const first = characters[0];
									const last = characters.at(-1);
									if (!first || !last) {
										continue;
									}

									const messageId = getMessageId(kind);

									context.report({
										message: messageId,
										range: {
											begin: range.begin + 1 + first.start,
											end: range.begin + 1 + last.end,
										},
										...(kind === "surrogatePairWithoutUFlag" && {
											suggestions: [
												{
													id: "addUnicodeFlag",
													range: { begin: range.end, end: range.end },
													text: "u",
												},
											],
										}),
									});
								}
							}
						},
					});
				},
			},
		};
	},
});
