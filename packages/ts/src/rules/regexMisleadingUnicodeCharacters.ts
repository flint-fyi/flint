import {
	type AST as RegExpAST,
	visitRegExpAST,
} from "@eslint-community/regexpp";
import {
	getTSNodeRange,
	typescriptLanguage,
} from "@flint.fyi/typescript-language";

import { ruleCreator } from "./ruleCreator.ts";
import { getRegExpLiteralDetails } from "./utils/getRegExpLiteralDetails.ts";
import { parseRegexpAst } from "./utils/parseRegexpAst.ts";

interface Match {
	kind: MatchKind;
	nodes: RegExpAST.Character[];
}

type MatchKind =
	| "combiningClass"
	| "emojiModifier"
	| "regionalIndicatorSymbol"
	| "surrogatePair"
	| "surrogatePairWithoutUFlag"
	| "zwj";

function findAllMatches(
	characters: RegExpAST.Character[],
	hasUnicodeFlag: boolean,
): Match[] {
	const matches: Match[] = [];

	if (hasUnicodeFlag) {
		for (const nodes of findSurrogatePairs(characters)) {
			matches.push({ kind: "surrogatePair", nodes });
		}
	} else {
		for (const nodes of findSurrogatePairsWithoutUFlag(characters)) {
			matches.push({ kind: "surrogatePairWithoutUFlag", nodes });
		}
	}

	for (const nodes of findCombiningClass(characters)) {
		matches.push({ kind: "combiningClass", nodes });
	}

	for (const nodes of findEmojiModifiers(characters)) {
		matches.push({ kind: "emojiModifier", nodes });
	}

	for (const nodes of findRegionalIndicatorSymbols(characters)) {
		matches.push({ kind: "regionalIndicatorSymbol", nodes });
	}

	for (const nodes of findZeroWidthJoins(characters)) {
		matches.push({ kind: "zwj", nodes });
	}

	return matches;
}

function* findCombiningClass(
	characters: RegExpAST.Character[],
): IterableIterator<RegExpAST.Character[]> {
	for (const [index, char] of characters.entries()) {
		const previous = characters[index - 1];
		if (
			previous &&
			isCombiningCharacter(char.value) &&
			!isCombiningCharacter(previous.value)
		) {
			yield [previous, char];
		}
	}
}

function* findEmojiModifiers(
	characters: RegExpAST.Character[],
): IterableIterator<RegExpAST.Character[]> {
	for (const [index, char] of characters.entries()) {
		const previous = characters[index - 1];
		if (
			previous &&
			isEmojiModifier(char.value) &&
			!isEmojiModifier(previous.value)
		) {
			yield [previous, char];
		}
	}
}

function* findRegionalIndicatorSymbols(
	characters: RegExpAST.Character[],
): IterableIterator<RegExpAST.Character[]> {
	for (const [index, char] of characters.entries()) {
		const previous = characters[index - 1];
		if (
			previous &&
			isRegionalIndicatorSymbol(char.value) &&
			isRegionalIndicatorSymbol(previous.value)
		) {
			yield [previous, char];
		}
	}
}

function* findSurrogatePairs(
	characters: RegExpAST.Character[],
): IterableIterator<RegExpAST.Character[]> {
	for (const [index, char] of characters.entries()) {
		const previous = characters[index - 1];
		if (
			previous &&
			isSurrogatePair(previous.value, char.value) &&
			(isUnicodeCodePointEscape(previous) || isUnicodeCodePointEscape(char))
		) {
			yield [previous, char];
		}
	}
}

function* findSurrogatePairsWithoutUFlag(
	characters: RegExpAST.Character[],
): IterableIterator<RegExpAST.Character[]> {
	for (const [index, char] of characters.entries()) {
		const previous = characters[index - 1];
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

function* findZeroWidthJoins(
	characters: RegExpAST.Character[],
): IterableIterator<RegExpAST.Character[]> {
	let sequence: RegExpAST.Character[] | undefined;

	for (const [index, char] of characters.entries()) {
		const previous = characters[index - 1];
		const next = characters[index + 1];

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
					sequence = characters.slice(index - 1, index + 2);
				}
			} else {
				sequence = characters.slice(index - 1, index + 2);
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

function isUnicodeCodePointEscape(char: RegExpAST.Character) {
	return /^\\u\{[\da-f]+\}$/iu.test(char.raw);
}

function* iterateCharacterSequence(
	nodes: RegExpAST.CharacterClassElement[],
): IterableIterator<RegExpAST.Character[]> {
	let sequence: RegExpAST.Character[] = [];

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
			primary: "Misleading combined character in character class.",
			secondary: [
				"The base character and combining mark are matched separately, not as a single unit.",
			],
			suggestions: [
				"Match the composed character outside of a character class.",
				"Use Unicode normalization for the regular expression.",
			],
		},
		emojiModifier: {
			primary: "Misleading emoji with skin tone modifier in character class.",
			secondary: [
				"The emoji and its modifier are matched separately, not as a single unit.",
			],
			suggestions: ["Match the emoji sequence outside of a character class."],
		},
		regionalIndicatorSymbol: {
			primary:
				"Misleading regional indicator symbols (flag) in character class.",
			secondary: [
				"The two regional indicator symbols are matched separately, not as a single flag.",
			],
			suggestions: ["Match the flag sequence outside of a character class."],
		},
		surrogatePair: {
			primary: "Misleading surrogate pair in character class.",
			secondary: [
				"The surrogate code points are represented with different escape types.",
			],
			suggestions: [
				"Use consistent escape sequences for both halves of the pair.",
			],
		},
		surrogatePairWithoutUFlag: {
			primary:
				"Misleading surrogate pair in character class without the `u` or `v` flag.",
			secondary: [
				"Without the unicode flag, each half of the surrogate pair is matched separately.",
			],
			suggestions: ["Add the `u` flag to the regex."],
		},
		zwj: {
			primary: "Misleading zero-width joiner sequence in character class.",
			secondary: [
				"Characters joined with ZWJ are matched separately, not as a single unit.",
				"Consider matching the sequence outside of a character class.",
			],
			suggestions: ["Match the ZWJ sequence outside of a character class."],
		},
	},
	setup(context) {
		return {
			visitors: {
				RegularExpressionLiteral: (node, services) => {
					const details = getRegExpLiteralDetails(node, services);
					const regexpAst = parseRegexpAst(details.pattern, details.flags);
					if (!regexpAst) {
						return;
					}

					const hasUnicodeFlag =
						details.flags.includes("u") || details.flags.includes("v");
					const range = getTSNodeRange(node, services.sourceFile);

					visitRegExpAST(regexpAst, {
						onCharacterClassEnter(characterClassNode) {
							for (const characters of iterateCharacterSequence(
								characterClassNode.elements,
							)) {
								const matches = findAllMatches(characters, hasUnicodeFlag);

								for (const { kind, nodes: characters } of matches) {
									// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
									const first = characters[0]!;
									// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
									const last = characters.at(-1)!;

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
