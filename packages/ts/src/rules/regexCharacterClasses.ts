import {
	type AST as RegExpAST,
	RegExpParser,
	visitRegExpAST,
} from "@eslint-community/regexpp";
import {
	getTSNodeRange,
	typescriptLanguage,
} from "@flint.fyi/typescript-language";

import { ruleCreator } from "./ruleCreator.ts";

interface CharAlternative {
	elements: CharElement[];
	isCharacter: true;
	raw: string;
}

interface CharElement {
	raw: string;
}

interface NonCharAlternative {
	isCharacter: false;
	raw: string;
}

type ParsedAlternative = CharAlternative | NonCharAlternative;

type SingleCharElement =
	| RegExpAST.Character
	| RegExpAST.CharacterClass
	| RegExpAST.CharacterSet
	| RegExpAST.ExpressionCharacterClass;

function categorizeAlternative(
	alternative: RegExpAST.Alternative,
): ParsedAlternative {
	if (isSingleCharElement(alternative.elements)) {
		const element = alternative.elements[0];
		const elements = toCharacterClassElement(element);
		if (elements) {
			return {
				elements,
				isCharacter: true,
				raw: alternative.raw,
			};
		}
	}

	return {
		isCharacter: false,
		raw: alternative.raw,
	};
}

function containsCharacterClass(alternatives: ParsedAlternative[]): boolean {
	for (const alt of alternatives) {
		if (
			alt.isCharacter &&
			alt.raw.startsWith("[") &&
			!alt.raw.startsWith("[^")
		) {
			return true;
		}
	}
	return false;
}

function elementsToCharacterClass(elements: CharElement[]): string {
	const parts: string[] = [];

	for (const element of elements) {
		parts.push(element.raw);
	}

	if (parts.length === 0) {
		return "[]";
	}

	if (parts[0]?.startsWith("^")) {
		parts[0] = `\\${parts[0]}`;
	}

	for (let i = 0; i < parts.length; i++) {
		const part = parts[i];
		if (part === "-") {
			parts[i] = "\\-";
		} else if (part === "]") {
			parts[i] = "\\]";
		}
	}

	return `[${parts.join("")}]`;
}

function isSingleCharElement(
	elements: readonly RegExpAST.Element[],
): elements is [SingleCharElement] {
	if (elements.length !== 1) {
		return false;
	}
	const element = elements[0];
	return (
		element !== undefined &&
		(element.type === "Character" ||
			element.type === "CharacterClass" ||
			element.type === "CharacterSet" ||
			element.type === "ExpressionCharacterClass")
	);
}

function mergeCharacterAlternatives(
	a: CharAlternative,
	b: CharAlternative,
): CharAlternative {
	const elements = [...a.elements, ...b.elements];
	return {
		elements,
		isCharacter: true,
		raw: elementsToCharacterClass(elements),
	};
}

function optimizeAlternatives(
	alternatives: ParsedAlternative[],
): ParsedAlternative[] {
	const result = [...alternatives];

	for (let i = 0; i < result.length - 1; i++) {
		let current = result[i];

		if (!current?.isCharacter) {
			continue;
		}

		for (let j = i + 1; j < result.length; j++) {
			const next = result[j];

			if (!next) {
				continue;
			}

			if (next.isCharacter) {
				current = mergeCharacterAlternatives(current, next);
				result.splice(j, 1);
				j--;
			} else {
				break;
			}
		}

		result[i] = current;
	}

	return result;
}

function toCharacterClassElement(
	element: SingleCharElement,
): CharElement[] | undefined {
	switch (element.type) {
		case "Character":
			return [element];

		case "CharacterClass":
			if (element.negate && !element.unicodeSets) {
				return undefined;
			}
			if (element.negate) {
				return [element];
			}
			return element.elements as CharElement[];

		case "CharacterSet":
			if (element.kind === "any") {
				return undefined;
			}
			return [element];

		case "ExpressionCharacterClass":
			return [element];

		default:
			return undefined;
	}
}

export default ruleCreator.createRule(typescriptLanguage, {
	about: {
		description:
			"Reports regex alternations that can be simplified to character classes.",
		id: "regexCharacterClasses",
		presets: ["stylisticStrict"],
	},
	messages: {
		preferCharacterClass: {
			primary:
				"This alternation can be simplified to a character class '{{ replacement }}'.",
			secondary: [
				"Character classes are more efficient than alternations and don't require backtracking.",
			],
			suggestions: [
				"Replace the alternation with a character class '{{ replacement }}'.",
			],
		},
	},
	setup(context) {
		const parser = new RegExpParser();

		function processAlternatives(
			alternatives: readonly RegExpAST.Alternative[],
		): undefined | { changed: boolean; replacement: string } {
			if (alternatives.length < 2) {
				return undefined;
			}

			const parsed = alternatives.map(categorizeAlternative);
			const characterCount = parsed.filter((a) => a.isCharacter).length;

			if (characterCount < 2) {
				return undefined;
			}

			const minAlternatives = 3;

			if (characterCount < minAlternatives && !containsCharacterClass(parsed)) {
				return undefined;
			}

			const optimized = optimizeAlternatives(parsed);

			if (optimized.length === parsed.length) {
				return undefined;
			}

			const replacement = optimized.map((a) => a.raw).join("|");
			return { changed: true, replacement };
		}

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

					const hasUnicode = flagsStr?.includes("u") ?? false;
					const hasUnicodeSets = flagsStr?.includes("v") ?? false;

					let regexpAst: RegExpAST.Pattern;
					try {
						regexpAst = parser.parsePattern(pattern, undefined, undefined, {
							unicode: hasUnicode,
							unicodeSets: hasUnicodeSets,
						});
					} catch {
						return;
					}

					visitRegExpAST(regexpAst, {
						onCapturingGroupEnter(group) {
							const result = processAlternatives(group.alternatives);
							if (result) {
								const nodeRange = getTSNodeRange(node, sourceFile);
								context.report({
									data: {
										replacement: result.replacement,
									},
									message: "preferCharacterClass",
									range: nodeRange,
								});
							}
						},
						onGroupEnter(group) {
							const result = processAlternatives(group.alternatives);
							if (result) {
								const nodeRange = getTSNodeRange(node, sourceFile);
								context.report({
									data: {
										replacement: result.replacement,
									},
									message: "preferCharacterClass",
									range: nodeRange,
								});
							}
						},
						onPatternEnter(patternNode) {
							const result = processAlternatives(patternNode.alternatives);
							if (result) {
								const nodeRange = getTSNodeRange(node, sourceFile);
								context.report({
									data: {
										replacement: result.replacement,
									},
									message: "preferCharacterClass",
									range: nodeRange,
								});
							}
						},
					});
				},
			},
		};
	},
});
