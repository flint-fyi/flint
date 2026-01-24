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

interface CharAlternative {
	elements: CharElement[];
	isCharacter: true;
	raw: string;
}

type CharElement =
	| RegExpAST.Character
	| RegExpAST.CharacterClass
	| RegExpAST.CharacterClassRange
	| RegExpAST.CharacterSet
	| RegExpAST.ClassStringDisjunction
	| RegExpAST.ExpressionCharacterClass;

type NodeWithAlternatives =
	| RegExpAST.CapturingGroup
	| RegExpAST.Group
	| RegExpAST.LookaheadAssertion
	| RegExpAST.LookbehindAssertion
	| RegExpAST.Pattern;

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

const reservedDoublePunctuatorCharacters = new Set([
	"!",
	"#",
	"$",
	"%",
	"&",
	"*",
	"+",
	",",
	".",
	":",
	";",
	"<",
	"=",
	">",
	"?",
	"@",
	"^",
	"`",
	"~",
]);

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
		switch (element.type) {
			case "Character":
				if (element.raw === "-") {
					parts.push("\\-");
				} else if (element.raw === "]") {
					parts.push("\\]");
				} else {
					parts.push(element.raw);
				}
				break;
			case "CharacterClass":
			case "CharacterClassRange":
			case "CharacterSet":
			case "ClassStringDisjunction":
			case "ExpressionCharacterClass":
				parts.push(element.raw);
				break;
		}
	}

	if (parts.length === 0) {
		return "[]";
	}

	if (parts[0]?.[0] === "^") {
		parts[0] = `\\${parts[0]}`;
	}

	for (let i = 1; i < parts.length; i++) {
		const prev = parts[i - 1];
		const curr = parts[i];
		if (prev && curr) {
			const pChar = prev.slice(-1);
			const cChar = curr[0];
			if (
				cChar &&
				reservedDoublePunctuatorCharacters.has(cChar) &&
				cChar === pChar &&
				!prev.endsWith(`\\${pChar}`)
			) {
				parts[i - 1] = `${prev.slice(0, -1)}\\${pChar}`;
			}
		}
	}

	return `[${parts.join("")}]`;
}

function getParentPrefixAndSuffix(
	parent: NodeWithAlternatives,
): [string, string] {
	switch (parent.type) {
		case "Assertion":
			return [
				`(?${parent.kind === "lookahead" ? "" : "<"}${parent.negate ? "!" : "="}`,
				")",
			];
		case "CapturingGroup":
			if (parent.name !== null) {
				return [`(?<${parent.name}>`, ")"];
			}
			return ["(", ")"];
		case "Group":
			return ["(?:", ")"];
		case "Pattern":
			return ["", ""];
	}
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
		function processAlternatives(
			node: NodeWithAlternatives,
		): undefined | { fixedPattern: string; replacement: string } {
			const alternatives = node.alternatives;
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
			const [prefix, suffix] = getParentPrefixAndSuffix(node);
			const fixedPattern = prefix + replacement + suffix;

			return { fixedPattern, replacement };
		}

		return {
			visitors: {
				RegularExpressionLiteral: (node, { sourceFile }) => {
					const text = node.getText(sourceFile);
					const match = /^\/(.+)\/([dgimsuyv]*)$/.exec(text);

					if (!match) {
						return;
					}

					const [, pattern, flags = ""] = match;

					if (!pattern) {
						return;
					}

					const regexpAst = parseRegexpAst(pattern, flags);
					if (!regexpAst) {
						return;
					}

					const nodeRange = getTSNodeRange(node, sourceFile);

					visitRegExpAST(regexpAst, {
						onAssertionEnter(assertion) {
							if (
								assertion.kind === "lookahead" ||
								assertion.kind === "lookbehind"
							) {
								const result = processAlternatives(assertion);
								if (result) {
									const newPattern =
										pattern.slice(0, assertion.start) +
										result.fixedPattern +
										pattern.slice(assertion.end);
									context.report({
										data: { replacement: result.replacement },
										fix: {
											range: nodeRange,
											text: `/${newPattern}/${flags}`,
										},
										message: "preferCharacterClass",
										range: nodeRange,
									});
								}
							}
						},
						onCapturingGroupEnter(group) {
							const result = processAlternatives(group);
							if (result) {
								const newPattern =
									pattern.slice(0, group.start) +
									result.fixedPattern +
									pattern.slice(group.end);
								context.report({
									data: { replacement: result.replacement },
									fix: {
										range: nodeRange,
										text: `/${newPattern}/${flags}`,
									},
									message: "preferCharacterClass",
									range: nodeRange,
								});
							}
						},
						onGroupEnter(group) {
							const result = processAlternatives(group);
							if (result) {
								const newPattern =
									pattern.slice(0, group.start) +
									result.fixedPattern +
									pattern.slice(group.end);
								context.report({
									data: { replacement: result.replacement },
									fix: {
										range: nodeRange,
										text: `/${newPattern}/${flags}`,
									},
									message: "preferCharacterClass",
									range: nodeRange,
								});
							}
						},
						onPatternEnter(patternNode) {
							const result = processAlternatives(patternNode);
							if (result) {
								context.report({
									data: { replacement: result.replacement },
									fix: {
										range: nodeRange,
										text: `/${result.replacement}/${flags}`,
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
