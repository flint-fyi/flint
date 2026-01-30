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

function collectFromElement<T>(
	element: RegExpAST.Element,
	collector: (el: RegExpAST.Element) => T[],
): Set<T> {
	const result = new Set<T>();

	forEachInGroup(element, (element) => {
		for (const item of collector(element)) {
			result.add(item);
		}
		return undefined;
	});

	return result;
}

function elementContainsPositiveSet(
	element: RegExpAST.Element,
	kind: RegExpAST.CharacterSet["kind"],
) {
	return forEachInGroup(
		element,
		(el) =>
			el.type === "CharacterSet" &&
			hasNegate(el) &&
			el.kind === kind &&
			!el.negate,
	);
}

function findFollowingElement(capturingGroup: RegExpAST.CapturingGroup) {
	const info = getAlternativeIndex(capturingGroup);
	return info?.elements[info.index + 1];
}

function findPrecedingQuantifier(capturingGroup: RegExpAST.CapturingGroup) {
	const info = getAlternativeIndex(capturingGroup);
	if (!info || info.index <= 0) {
		return undefined;
	}

	const previous = info.elements[info.index - 1];
	return previous?.type === "Quantifier" && previous.max > previous.min
		? previous
		: undefined;
}

function forEachInGroup(
	element: RegExpAST.Element,
	callback: (element: RegExpAST.Element) => boolean | undefined,
) {
	switch (element.type) {
		case "CapturingGroup":
		case "Group":
			for (const alt of element.alternatives) {
				for (const el of alt.elements) {
					if (forEachInGroup(el, callback)) {
						return true;
					}
				}
			}
			return false;

		case "Quantifier":
			return forEachInGroup(element.element, callback);

		default:
			return callback(element) === true;
	}
}

function getAlternativeIndex(capturingGroup: RegExpAST.CapturingGroup) {
	const parent = capturingGroup.parent;
	if (parent.type !== "Alternative") {
		return undefined;
	}
	const index = parent.elements.indexOf(capturingGroup);
	return index === -1 ? undefined : { elements: parent.elements, index };
}

function getCharacterSetType(el: RegExpAST.CharacterSet): string {
	if (el.kind === "any") {
		return "set:any";
	}
	if (!hasNegate(el)) {
		return "";
	}
	return `set:${el.kind}${el.negate ? ":negated" : ""}`;
}

function getCharacterValues(
	elements: RegExpAST.CharacterClassElement[],
): number[] {
	const result: number[] = [];
	for (const el of elements) {
		if (el.type === "Character") {
			result.push(el.value);
		}
	}
	return result;
}

function getClassExcludedChars(element: RegExpAST.Element): Set<number> {
	if (element.type !== "CharacterClass" || !element.negate) {
		return new Set<number>();
	}
	return new Set<number>(getCharacterValues(element.elements));
}

function getElementCharacters(element: RegExpAST.Element): Set<number> {
	return collectFromElement<number>(element, (el): number[] => {
		if (el.type === "Character") {
			return [el.value];
		}
		if (el.type === "CharacterClass") {
			return getCharacterValues(el.elements);
		}
		return [];
	});
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

function getFirstElementInGroup(element: RegExpAST.Element) {
	let current: RegExpAST.Element | undefined = element;

	while (current) {
		if (current.type === "Quantifier") {
			current = current.element;
			continue;
		}
		if (current.type === "Group" || current.type === "CapturingGroup") {
			const alternative: RegExpAST.Alternative | undefined =
				current.alternatives[0];
			if (!alternative) {
				return undefined;
			}
			current = alternative.elements[0];
			continue;
		}
		break;
	}

	return current;
}

function getMatchableCharacterTypes(element: RegExpAST.Element) {
	return collectFromElement(element, (el) => {
		if (el.type === "Character") {
			return [`char:${el.value}`];
		}
		if (el.type === "CharacterSet") {
			const type = getCharacterSetType(el);
			return type ? [type] : [];
		}
		if (el.type === "CharacterClass") {
			return el.elements.flatMap((child) => {
				if (child.type === "Character") {
					return [`char:${child.value}`];
				}
				if (child.type === "CharacterSet" && hasNegate(child)) {
					return [`set:${child.kind}${child.negate ? ":negated" : ""}`];
				}
				if (child.type === "CharacterClassRange") {
					return [`range:${child.min.value}-${child.max.value}`];
				}
				return [];
			});
		}
		return [];
	});
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

function hasNegate(node: RegExpAST.CharacterSet) {
	return "negate" in node;
}

function hasOverlap(a: Set<string>, b: Set<string>) {
	if (a.has("set:any") || b.has("set:any")) {
		return true;
	}

	for (const type of a) {
		if (b.has(type)) {
			return true;
		}
	}

	return false;
}

function isAllowedEndPattern(
	endQuantifier: RegExpAST.Quantifier,
	followingElement: RegExpAST.Element,
) {
	return (
		isDotDelimiterPattern(endQuantifier, followingElement) ||
		isNegatedSetFollowedByPositive(endQuantifier, followingElement) ||
		isExcludedDelimiterPattern(endQuantifier, followingElement)
	);
}

function isDotDelimiterPattern(
	endQuantifier: RegExpAST.Quantifier,
	followingElement: RegExpAST.Element,
) {
	return (
		endQuantifier.element.type === "CharacterSet" &&
		endQuantifier.element.kind === "any" &&
		followingElement.type === "Character"
	);
}

function isExcludedDelimiterPattern(
	endQuantifier: RegExpAST.Quantifier,
	followingElement: RegExpAST.Element,
) {
	if (
		endQuantifier.element.type !== "CharacterClass" ||
		!endQuantifier.element.negate
	) {
		return false;
	}

	const excluded = getClassExcludedChars(endQuantifier.element);
	if (!excluded.size) {
		return false;
	}

	const followingChars = getElementCharacters(followingElement);
	for (const character of followingChars) {
		if (excluded.has(character)) {
			return true;
		}
	}

	return false;
}

function isNegatedSetFollowedByPositive(
	endQuantifier: RegExpAST.Quantifier,
	followingElement: RegExpAST.Element,
) {
	return (
		endQuantifier.element.type === "CharacterSet" &&
		hasNegate(endQuantifier.element) &&
		endQuantifier.element.negate &&
		elementContainsPositiveSet(followingElement, endQuantifier.element.kind)
	);
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
					checkMisleadingStart(cgNode, patternStart);
					checkMisleadingEnd(cgNode, patternStart);
				},
			});
		}

		function checkMisleadingStart(
			capturingGroupNode: RegExpAST.CapturingGroup,
			patternStart: number,
		) {
			const precedingQuantifier = findPrecedingQuantifier(capturingGroupNode);
			const firstAlternative = capturingGroupNode.alternatives[0];
			if (!precedingQuantifier || !firstAlternative) {
				return;
			}

			const startQuantifier = getStartQuantifier(firstAlternative, "ltr");
			if (!startQuantifier) {
				return;
			}

			if (
				startQuantifier.element.type === "CharacterSet" &&
				startQuantifier.element.kind === "any"
			) {
				return;
			}

			const precedingTypes = getMatchableCharacterTypes(
				precedingQuantifier.element,
			);
			const captureTypes = getMatchableCharacterTypes(startQuantifier.element);

			if (!hasOverlap(precedingTypes, captureTypes)) {
				return;
			}

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

		function checkMisleadingEnd(
			capturingGroupNode: RegExpAST.CapturingGroup,
			patternStart: number,
		) {
			const endQuantifier = getEndQuantifier(capturingGroupNode);
			if (!endQuantifier) {
				return;
			}

			const followingElement = findFollowingElement(capturingGroupNode);
			if (
				!followingElement ||
				isAllowedEndPattern(endQuantifier, followingElement)
			) {
				return;
			}

			const endTypes = getMatchableCharacterTypes(endQuantifier.element);
			const firstFollowing = getFirstElementInGroup(followingElement);
			const followingTypes = firstFollowing
				? getMatchableCharacterTypes(firstFollowing)
				: new Set<string>();

			if (!hasOverlap(endTypes, followingTypes)) {
				return;
			}

			context.report({
				data: { quantifierRaw: endQuantifier.raw },
				message: "misleadingEnd",
				range: {
					begin: patternStart + endQuantifier.start,
					end: patternStart + endQuantifier.end,
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
