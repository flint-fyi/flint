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

function canConsumeCharacters(element: RegExpAST.Element): boolean {
	switch (element.type) {
		case "Assertion":
			return false;

		case "CapturingGroup":
		case "Group":
			return element.alternatives.some((alternative) =>
				alternative.elements.some(canConsumeCharacters),
			);

		case "Quantifier":
			return element.max !== 0 && canConsumeCharacters(element.element);

		default:
			return true;
	}
}

function getUnnecessaryAssertions(
	quantifierElement: RegExpAST.Element,
	assertions: RegExpAST.Assertion[],
) {
	return assertions.filter((assertion) =>
		isOptionalAssertion(quantifierElement, assertion),
	);
}

function isOptionalAssertion(
	quantifierElement: RegExpAST.Element,
	assertion: RegExpAST.Assertion,
) {
	let current: RegExpAST.Node = assertion;

	while (current !== quantifierElement) {
		const parent = current.parent;
		if (!parent) {
			return false;
		}

		switch (parent.type) {
			case "Alternative": {
				for (const sibling of parent.elements) {
					if (sibling === current) {
						continue;
					}
					if (canConsumeCharacters(sibling)) {
						return false;
					}
				}
				break;
			}

			case "CapturingGroup":
			case "Group": {
				if (parent !== quantifierElement) {
					const containingAlternative = parent.alternatives.find(
						(alternative) =>
							alternative === current ||
							alternative.elements.some(function containsNode(element) {
								if (element === current) {
									return true;
								}
								if (
									element.type === "Group" ||
									element.type === "CapturingGroup"
								) {
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
				break;
			}

			case "Quantifier":
				if (
					parent !== quantifierElement &&
					parent.max > 1 &&
					canConsumeCharacters(parent.element)
				) {
					return false;
				}
				break;
		}

		current = parent as RegExpAST.Node;
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
				"The assertion `{{ raw }}` inside optional quantifier `{{ quantifier }}` is unnecessary.",
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

			const zeroMinQuantifierStack: RegExpAST.Quantifier[] = [];
			const collectedAssertions: RegExpAST.Assertion[] = [];

			visitRegExpAST(regexpAst, {
				onAssertionEnter(assertion) {
					if (zeroMinQuantifierStack.length) {
						collectedAssertions.push(assertion);
					}
				},
				onQuantifierEnter(quantifier) {
					if (quantifier.min === 0) {
						zeroMinQuantifierStack.push(quantifier);
					}
				},
				onQuantifierLeave(quantifier) {
					if (quantifier.min === 0) {
						const popped = zeroMinQuantifierStack.pop();
						if (popped === quantifier && collectedAssertions.length) {
							const assertionsInThisQuantifier = collectedAssertions.filter(
								(assertion) => isDescendantOf(assertion, quantifier),
							);

							const unnecessary = getUnnecessaryAssertions(
								quantifier.element,
								assertionsInThisQuantifier,
							);

							for (const assertion of unnecessary) {
								context.report({
									data: {
										quantifier: quantifier.raw,
										raw: assertion.raw,
									},
									fix: {
										range: {
											begin: patternStart + assertion.start,
											end: patternStart + assertion.end,
										},
										text: "",
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
			node: RegExpAST.Node,
			ancestor: RegExpAST.Quantifier,
		): boolean {
			let current: null | RegExpAST.Node = node;

			while (current) {
				if (current === ancestor) {
					return true;
				}
				current = current.parent;
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
