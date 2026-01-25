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

	for (let i = index - 1; i >= 0; i--) {
		// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
		const element = parent.elements[i]!;
		if (element.type === "Quantifier" && element.max > element.min) {
			return element;
		}
	}

	return undefined;
}

function getEndQuantifier(capturingGroup: RegExpAST.CapturingGroup) {
	for (const alt of capturingGroup.alternatives) {
		if (alt.elements.length === 0) {
			continue;
		}

		// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
		const last = alt.elements.at(-1)!;
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
			for (const alt of element.alternatives) {
				for (const child of alt.elements) {
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
			for (const child of element.elements) {
				if (child.type === "Character") {
					types.add(`char:${child.value}`);
				} else if (child.type === "CharacterSet") {
					types.add(`set:${child.kind}`);
				} else if (child.type === "CharacterClassRange") {
					types.add(`range:${child.min.value}-${child.max.value}`);
				}
			}
			break;

		case "CharacterSet":
			types.add(`set:${element.kind}`);
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

export default ruleCreator.createRule(typescriptLanguage, {
	about: {
		description:
			"Reports capturing groups that capture less text than their pattern suggests.",
		id: "regexMisleadingCapturingGroups",
		presets: ["logical"],
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
						const followingTypes = getMatchableCharacterTypes(followingElement);

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
