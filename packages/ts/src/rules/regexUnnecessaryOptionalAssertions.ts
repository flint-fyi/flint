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

type RegExpAssertion = RegExpAST.Assertion;
type RegExpElement = RegExpAST.Element;
type RegExpNode = RegExpAST.Node;
type RegExpQuantifier = RegExpAST.Quantifier;

function canConsumeCharacters(element: RegExpElement): boolean {
	switch (element.type) {
		case "Assertion":
			return false;
		case "Backreference":
			return true;
		case "CapturingGroup":
		case "Group":
			return element.alternatives.some((alternative) =>
				alternative.elements.some(canConsumeCharacters),
			);
		case "Character":
		case "CharacterClass":
		case "CharacterSet":
		case "ExpressionCharacterClass":
			return true;
		case "Quantifier":
			if (element.max === 0) {
				return false;
			}
			return canConsumeCharacters(element.element);
		default:
			return true;
	}
}

function findUnnecessaryAssertions(
	quantifierElement: RegExpElement,
	assertions: RegExpAssertion[],
): RegExpAssertion[] {
	return assertions.filter((assertion) =>
		isOptionalAssertion(quantifierElement, assertion),
	);
}

function isOptionalAssertion(
	quantifierElement: RegExpElement,
	assertion: RegExpAssertion,
): boolean {
	let current: RegExpNode = assertion;

	while (current !== quantifierElement) {
		const parent = current.parent;
		if (!parent) {
			return false;
		}

		if (parent.type === "Alternative") {
			for (const sibling of parent.elements) {
				if (sibling === current) {
					continue;
				}
				if (canConsumeCharacters(sibling)) {
					return false;
				}
			}
		}

		if (parent.type === "Quantifier" && parent !== quantifierElement) {
			if (parent.max > 1 && canConsumeCharacters(parent.element)) {
				return false;
			}
		}

		if (
			(parent.type === "CapturingGroup" || parent.type === "Group") &&
			parent !== quantifierElement
		) {
			const containingAlternative = parent.alternatives.find(
				(alt) =>
					alt === current ||
					alt.elements.some(function containsNode(element): boolean {
						if (element === current) {
							return true;
						}
						if (element.type === "Group" || element.type === "CapturingGroup") {
							return element.alternatives.some((a) =>
								a.elements.some(containsNode),
							);
						}
						if (element.type === "Quantifier") {
							return containsNode(element.element);
						}
						return false;
					}),
			);

			if (containingAlternative) {
				for (const element of containingAlternative.elements) {
					if (element !== current && canConsumeCharacters(element)) {
						return false;
					}
				}
			}
		}

		current = parent as RegExpNode;
	}

	return true;
}

export default ruleCreator.createRule(typescriptLanguage, {
	about: {
		description:
			"Reports assertions inside optional quantifiers that have no effect.",
		id: "regexUnnecessaryOptionalAssertions",
		presets: ["logical"],
	},
	messages: {
		unnecessaryOptionalAssertion: {
			primary:
				"Remove unnecessary assertion '{{ raw }}' inside optional quantifier '{{ quantifier }}'.",
			secondary: [
				"This assertion is inside a quantifier with minimum 0, and all paths to the assertion consume no characters.",
				"The regex engine can skip the entire quantified element, making this assertion useless.",
			],
			suggestions: [
				"Add character-consuming elements in the same path as the assertion.",
				"Remove the assertion if it's not needed.",
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

			const zeroMinQuantifierStack: RegExpQuantifier[] = [];
			const collectedAssertions: RegExpAssertion[] = [];

			visitRegExpAST(regexpAst, {
				onAssertionEnter(assertion) {
					if (zeroMinQuantifierStack.length === 0) {
						return;
					}
					collectedAssertions.push(assertion);
				},
				onQuantifierEnter(quantifier) {
					if (quantifier.min === 0) {
						zeroMinQuantifierStack.push(quantifier);
					}
				},
				onQuantifierLeave(quantifier) {
					if (quantifier.min === 0) {
						const popped = zeroMinQuantifierStack.pop();
						if (popped === quantifier && collectedAssertions.length > 0) {
							const assertionsInThisQuantifier = collectedAssertions.filter(
								(assertion) => isDescendantOf(assertion, quantifier),
							);

							const unnecessary = findUnnecessaryAssertions(
								quantifier.element,
								assertionsInThisQuantifier,
							);

							for (const assertion of unnecessary) {
								context.report({
									data: {
										quantifier: quantifier.raw,
										raw: assertion.raw,
									},
									message: "unnecessaryOptionalAssertion",
									range: {
										begin: patternStart + assertion.start,
										end: patternStart + assertion.end,
									},
								});
							}

							for (const assertion of assertionsInThisQuantifier) {
								const index = collectedAssertions.indexOf(assertion);
								if (index !== -1) {
									collectedAssertions.splice(index, 1);
								}
							}
						}
					}
				},
			});
		}

		function isDescendantOf(
			node: RegExpNode,
			ancestor: RegExpQuantifier,
		): boolean {
			let current: null | RegExpNode = node;
			while (current) {
				if (current === ancestor) {
					return true;
				}
				current = current.parent as null | RegExpNode;
			}
			return false;
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
				construction.pattern,
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
