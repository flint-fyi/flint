import {
	type AST as RegExpAST,
	visitRegExpAST,
} from "@eslint-community/regexpp";
import { typescriptLanguage } from "@flint.fyi/typescript-language";
import type {
	AST,
	TypeScriptFileServices,
} from "@flint.fyi/typescript-language";

import { ruleCreator } from "./ruleCreator.ts";
import { getRegExpConstruction } from "./utils/getRegExpConstruction.ts";
import { getRegExpLiteralDetails } from "./utils/getRegExpLiteralDetails.ts";
import { parseRegexpAst } from "./utils/parseRegexpAst.ts";

function elementContainsPositiveSet(
	element: RegExpAST.Element,
	kind: RegExpAST.CharacterSet["kind"],
): boolean {
	switch (element.type) {
		case "CapturingGroup":
		case "Group": {
			for (const alternative of element.alternatives) {
				for (const element of alternative.elements) {
					if (elementContainsPositiveSet(element, kind)) {
						return true;
					}
				}
			}
			return false;
		}
		case "CharacterSet":
			return element.kind === kind && !element.negate;
		case "Quantifier":
			return elementContainsPositiveSet(element.element, kind);
		default:
			return false;
	}
}

function findFollowingElement(capturingGroup: RegExpAST.CapturingGroup) {
	const parent = capturingGroup.parent;
	if (parent.type !== "Alternative") {
		return undefined;
	}

	const index = parent.elements.indexOf(capturingGroup);
	return index === -1 ? undefined : parent.elements[index + 1];
}

function findPrecedingQuantifier(capturingGroup: RegExpAST.CapturingGroup) {
	const parent = capturingGroup.parent;
	if (parent.type !== "Alternative") {
		return undefined;
	}

	const index = parent.elements.indexOf(capturingGroup);
	if (index <= 0) {
		return undefined;
	}

	// Only consider the immediately preceding element; separators break the relation.
	// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
	const previous = parent.elements[index - 1]!;

	return previous.type === "Quantifier" && previous.max > previous.min
		? previous
		: undefined;
}

function getClassExcludedChars(element: RegExpAST.Element): Set<number> {
	const excluded = new Set<number>();
	if (element.type === "CharacterClass" && element.negate) {
		for (const child of element.elements) {
			if (child.type === "Character") {
				excluded.add(child.value);
			}
		}
	}
	return excluded;
}

function getElementCharacters(element: RegExpAST.Element): Set<number> {
	const characters = new Set<number>();

	switch (element.type) {
		case "CapturingGroup":
		case "Group":
			for (const alternative of element.alternatives) {
				for (const element of alternative.elements) {
					for (const character of getElementCharacters(element)) {
						characters.add(character);
					}
				}
			}
			break;
		case "Character":
			characters.add(element.value);
			break;
		case "CharacterClass":
			for (const child of element.elements) {
				if (child.type === "Character") {
					characters.add(child.value);
				}
			}
			break;
		case "Quantifier":
			for (const character of getElementCharacters(element.element)) {
				characters.add(character);
			}
			break;
	}

	return characters;
}

function getEndQuantifier(capturingGroup: RegExpAST.CapturingGroup) {
	for (const alternative of capturingGroup.alternatives) {
		if (alternative.elements.length === 0) {
			continue;
		}

		// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
		const last = alternative.elements.at(-1)!;
		if (last.type === "Quantifier" && last.max > last.min) {
			return last;
		}
	}

	return undefined;
}

function getMatchableCharacterTypes(element: RegExpAST.Element) {
	const types = new Set<string>();

	switch (element.type) {
		case "CapturingGroup":
		case "Group":
			for (const alternative of element.alternatives) {
				for (const child of alternative.elements) {
					for (const type of getMatchableCharacterTypes(child)) {
						types.add(type);
					}
				}
			}
			break;

		case "Character":
			types.add(`char:${element.value}`);
			break;

		case "CharacterClass":
			// Note: overall class negation is complex; keep per-element collection
			for (const child of element.elements) {
				if (child.type === "Character") {
					types.add(`char:${child.value}`);
				} else if (child.type === "CharacterSet") {
					const negateSuffix = child.negate ? ":negated" : "";
					types.add(`set:${child.kind}${negateSuffix}`);
				} else if (child.type === "CharacterClassRange") {
					types.add(`range:${child.min.value}-${child.max.value}`);
				}
			}
			break;

		case "CharacterSet":
			{
				const negateSuffix = element.negate ? ":negated" : "";
				types.add(`set:${element.kind}${negateSuffix}`);
			}
			break;

		case "Quantifier":
			for (const type of getMatchableCharacterTypes(element.element)) {
				types.add(type);
			}
			break;

		default:
			break;
	}

	return types;
}

function getStartQuantifier(
	alternative: RegExpAST.Alternative,
	direction: "ltr" | "rtl",
): RegExpAST.Quantifier | undefined {
	const elements = alternative.elements;
	if (elements.length === 0) {
		return undefined;
	}

	const first = direction === "ltr" ? elements[0] : elements.at(-1);
	if (!first) {
		return undefined;
	}

	if (first.type === "Quantifier") {
		return first;
	}

	if (first.type === "Group") {
		for (const alt of first.alternatives) {
			const quantifier = getStartQuantifier(alt, direction);
			if (quantifier) {
				return quantifier;
			}
		}
	}

	return undefined;
}

function hasOverlap(a: Set<string>, b: Set<string>) {
	// If either side matches any character (dot), it overlaps with literals and most sets.
	if (a.has("set:any") || b.has("set:any")) {
		return true;
	}

	// Treat negated simple sets as disjoint from their non-negated counterparts.
	const simpleSets = ["space", "digit", "word"] as const;
	for (const kind of simpleSets) {
		const aPos = a.has(`set:${kind}`);
		const aNeg = a.has(`set:${kind}:negated`);
		const bPos = b.has(`set:${kind}`);
		const bNeg = b.has(`set:${kind}:negated`);
		// If one side is the negation and the other is the positive of the same kind, they do not overlap.
		if ((aPos && bNeg) || (aNeg && bPos)) {
			// continue without early return to allow other overlaps to be considered
			// but if both are exclusively this relation and no other shared types, we'll return false below
		}
	}

	for (const type of a) {
		if (b.has(type)) {
			return true;
		}
	}

	return false;
}

export default ruleCreator.createRule(typescriptLanguage, {
	about: {
		description:
			"Reports capturing groups that capture less text than their pattern suggests.",
		id: "regexMisleadingCapturingGroups",
		presets: ["logical", "logicalStrict"],
	},
	messages: {
		misleadingEnd: {
			primary:
				"Quantifier '{{ quantifierRaw }}' at the end of capturing group may capture less than expected due to backtracking.",
			secondary: [
				"The quantifier at the end of this capturing group may give up characters during backtracking to satisfy a following pattern.",
			],
			suggestions: ["Use an atomic group.", "Rewrite the pattern."],
		},
		misleadingStart: {
			primary:
				"Capturing group with '{{ captureRaw }}' will always capture {{ behavior }} because '{{ precedingRaw }}' consumes matching characters first.",
			secondary: [
				"The quantifier in this capturing group can never match as much as expected because a preceding quantifier already consumed the characters.",
			],
			suggestions: [
				"Remove the quantifier in the capturing group.",
				"Simplify the quantifier in the capturing group.",
			],
		},
	},
	setup(context) {
		function checkPattern(
			pattern: string,
			patternStart: number,
			flags: string,
		) {
			const regexpAst = parseRegexpAst(pattern, flags);
			if (!regexpAst) {
				return;
			}

			visitRegExpAST(regexpAst, {
				onCapturingGroupEnter(cgNode) {
					const precedingQuantifier = findPrecedingQuantifier(cgNode);
					const firstAlternative = cgNode.alternatives[0];
					if (precedingQuantifier && firstAlternative) {
						const startQuantifier = getStartQuantifier(firstAlternative, "ltr");
						if (startQuantifier) {
							const precedingTypes = getMatchableCharacterTypes(
								precedingQuantifier.element,
							);
							const captureTypes = getMatchableCharacterTypes(
								startQuantifier.element,
							);

							// Allow broad dot-quantifiers at the start of a capturing group.
							if (
								startQuantifier.element.type === "CharacterSet" &&
								startQuantifier.element.kind === "any"
							) {
								return;
							}

							if (hasOverlap(precedingTypes, captureTypes)) {
								const behavior =
									startQuantifier.min === 0
										? "the empty string"
										: `only ${startQuantifier.min} character${startQuantifier.min > 1 ? "s" : ""}`;

								context.report({
									data: {
										behavior,
										captureRaw: startQuantifier.raw,
										precedingRaw: precedingQuantifier.raw,
									},
									message: "misleadingStart",
									range: {
										begin: patternStart + startQuantifier.start,
										end: patternStart + startQuantifier.end,
									},
								});
							}
						}
					}

					const endQuantifier = getEndQuantifier(cgNode);
					const followingElement = findFollowingElement(cgNode);
					if (endQuantifier && followingElement) {
						const endTypes = getMatchableCharacterTypes(endQuantifier.element);
						const firstFollowing = ((element: RegExpAST.Element) => {
							let current: RegExpAST.Element | undefined = element;
							// Descend into quantifiers and groups to find the first inner element
							// Skip assertions implicitly as they won't produce text
							while (current) {
								if (current.type === "Quantifier") {
									current = current.element;
									continue;
								}
								if (
									current.type === "Group" ||
									current.type === "CapturingGroup"
								) {
									const alternative = current.alternatives[0];
									current = alternative?.elements[0];
									continue;
								}
								break;
							}
							return current;
						})(followingElement);

						const followingTypes = firstFollowing
							? getMatchableCharacterTypes(firstFollowing)
							: new Set<string>();

						// Common delimiter patterns: /(.*)\/.../ and /[^x]+x/ — allow without reporting.
						// 1) Dot-quantifier followed by a literal delimiter
						if (
							endQuantifier.element.type === "CharacterSet" &&
							endQuantifier.element.kind === "any" &&
							followingElement.type === "Character"
						) {
							return;
						}

						// 2) Negated simple set followed by its positive counterpart (e.g., \S+ then \s+)
						if (
							endQuantifier.element.type === "CharacterSet" &&
							endQuantifier.element.negate &&
							elementContainsPositiveSet(
								followingElement,
								endQuantifier.element.kind,
							)
						) {
							return;
						}

						// 3) Negated character class excluding specific delimiters followed by those delimiters
						if (
							endQuantifier.element.type === "CharacterClass" &&
							endQuantifier.element.negate
						) {
							const excluded = getClassExcludedChars(endQuantifier.element);
							if (excluded.size) {
								const followingChars = getElementCharacters(followingElement);
								for (const ch of followingChars) {
									if (excluded.has(ch)) {
										return;
									}
								}
							}
						}

						if (hasOverlap(endTypes, followingTypes)) {
							context.report({
								data: {
									quantifierRaw: endQuantifier.raw,
								},
								message: "misleadingEnd",
								range: {
									begin: patternStart + endQuantifier.start,
									end: patternStart + endQuantifier.end,
								},
							});
						}
					}
				},
			});
		}

		function checkRegexLiteral(
			node: AST.RegularExpressionLiteral,
			services: TypeScriptFileServices,
		) {
			const details = getRegExpLiteralDetails(node, services);
			checkPattern(details.pattern, details.start, details.flags);
		}

		function checkRegExpConstructor(
			node: AST.CallExpression | AST.NewExpression,
			services: TypeScriptFileServices,
		) {
			const construction = getRegExpConstruction(node, services);
			if (!construction) {
				return;
			}

			checkPattern(
				construction.raw,
				construction.start + 1,
				construction.flags,
			);
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
