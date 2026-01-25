import type { AST as RegExpAST } from "@eslint-community/regexpp";
import { typescriptLanguage } from "@flint.fyi/typescript-language";
import type {
	AST,
	TypeScriptFileServices,
} from "@flint.fyi/typescript-language";

import { ruleCreator } from "./ruleCreator.ts";
import { getRegExpConstruction } from "./utils/getRegExpConstruction.ts";
import { getRegExpLiteralDetails } from "./utils/getRegExpLiteralDetails.ts";
import { parseRegexpAst } from "./utils/parseRegexpAst.ts";

function canMatchEmpty(element: RegExpAST.Element) {
	switch (element.type) {
		case "Assertion":
			return true;
		case "CapturingGroup":
		case "Group":
			return element.alternatives.some((alternative) =>
				alternative.elements.every(canMatchEmpty),
			);
		case "Quantifier":
			return element.min === 0;
		default:
			return false;
	}
}

function canReject(element: RegExpAST.Element): boolean {
	switch (element.type) {
		case "Assertion":
			return element.kind === "end" || element.kind === "word";
		case "Backreference":
		case "Character":
		case "ExpressionCharacterClass":
			return true;
		case "CapturingGroup":
		case "Group":
			return element.alternatives.some((alternative) =>
				alternative.elements.some(canReject),
			);
		case "CharacterClass":
			return !isMatchAll(element);
		case "CharacterSet":
			return element.kind !== "any" || element.raw !== "[\\s\\S]";
		case "Quantifier":
			return element.min !== 0 && canReject(element.element);
		default:
			return false;
	}
}

function findReachableQuantifiers(pattern: RegExpAST.Pattern) {
	const quantifiers: RegExpAST.Quantifier[] = [];

	function walkAlternative(alternative: RegExpAST.Alternative) {
		for (const element of alternative.elements) {
			switch (element.type) {
				case "CapturingGroup":
				case "Group":
					for (const innerAlternative of element.alternatives) {
						walkAlternative(innerAlternative);
					}
					break;

				case "Quantifier":
					if (element.max === Infinity && element.min === 0) {
						quantifiers.push(element);
					}
					break;
			}

			if (!canMatchEmpty(element)) {
				return;
			}
		}
	}

	for (const alternative of pattern.alternatives) {
		walkAlternative(alternative);
	}

	return quantifiers;
}

function generateAttackString(quantifier: RegExpAST.Quantifier) {
	let character: string | undefined;

	switch (quantifier.element.type) {
		case "Character": {
			character = String.fromCharCode(quantifier.element.value);
			break;
		}

		case "CharacterClass": {
			// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
			const first = quantifier.element.elements[0]!;
			if (first.type === "Character") {
				character = String.fromCharCode(first.value);
			}
			break;
		}

		case "CharacterSet": {
			switch (quantifier.element.kind) {
				case "any":
					character = "x";
					break;
				case "digit":
					character = "0";
					break;
				case "space":
					character = " ";
					break;
			}
			break;
		}
	}

	return (character ?? "a").repeat(20);
}

function getFollowingElements(quantifier: RegExpAST.Quantifier) {
	const index = quantifier.parent.elements.indexOf(quantifier);
	const following = quantifier.parent.elements.slice(index + 1);
	const grandparent = quantifier.parent.parent;

	if (grandparent.type === "CapturingGroup" || grandparent.type === "Group") {
		const groupParent = grandparent.parent;

		if (groupParent.type === "Alternative") {
			following.push(
				...groupParent.elements.slice(
					groupParent.elements.indexOf(grandparent) + 1,
				),
			);
		}
	}

	return following;
}

function hasRejectingSuffix(quantifier: RegExpAST.Quantifier) {
	return getFollowingElements(quantifier).some(canReject);
}

function isAnchoredAtStart(pattern: RegExpAST.Pattern) {
	return pattern.alternatives.every((alternative) => {
		// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
		const first = alternative.elements[0]!;
		return first.type === "Assertion" && first.kind === "start";
	});
}

function isMatchAll(characterClass: RegExpAST.CharacterClass) {
	return characterClass.negate && characterClass.elements.length === 0;
}

export default ruleCreator.createRule(typescriptLanguage, {
	about: {
		description:
			"Reports quantifiers that can cause quadratic regex matching time.",
		id: "regexSuperLinearMoves",
		presets: ["logical"],
	},
	messages: {
		superLinear: {
			primary:
				"This quantifier can cause quadratic regex matching time. An input like `{{ attack }}` could trigger slow matching.",
			secondary: [
				"When a quantifier at the start of a pattern is followed by elements that can fail to match, the regex engine may try the pattern from each position in the input string.",
				"For an input of length n, this can result in O(n²) time complexity.",
			],
			suggestions: [
				"Anchor the pattern with `^` to prevent repeated matching attempts.",
				"Ensure the quantifier is preceded by a required consuming element.",
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
			if (!regexpAst || isAnchoredAtStart(regexpAst)) {
				return;
			}

			const quantifiers =
				findReachableQuantifiers(regexpAst).filter(hasRejectingSuffix);

			for (const quantifier of quantifiers) {
				context.report({
					data: {
						attack: generateAttackString(quantifier),
					},
					message: "superLinear",
					range: {
						begin: patternStart + quantifier.start,
						end: patternStart + quantifier.end,
					},
				});
			}
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
