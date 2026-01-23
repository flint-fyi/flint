import type { AST as RegExpAST } from "@eslint-community/regexpp";
import { typescriptLanguage } from "@flint.fyi/typescript-language";
import type { AST } from "@flint.fyi/typescript-language";
import * as ts from "typescript";

import { ruleCreator } from "./ruleCreator.ts";
import { parseRegexpAst } from "./utils/parseRegexpAst.ts";

type Alternative = RegExpAST.Alternative;
type Element = RegExpAST.Element;
type Pattern = RegExpAST.Pattern;
type Quantifier = RegExpAST.Quantifier;

function canMatchEmpty(element: Element): boolean {
	switch (element.type) {
		case "Assertion":
			return true;
		case "Backreference":
		case "Character":
		case "CharacterClass":
		case "CharacterSet":
		case "ExpressionCharacterClass":
			return false;
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

function canReject(element: Element): boolean {
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
			if (element.min === 0) {
				return false;
			}
			return canReject(element.element);
		default:
			return false;
	}
}

function findReachableQuantifiers(pattern: Pattern): Quantifier[] {
	const quantifiers: Quantifier[] = [];

	function walkAlternative(alternative: Alternative) {
		for (const element of alternative.elements) {
			if (element.type === "Quantifier") {
				if (element.max === Infinity && element.min === 0) {
					quantifiers.push(element);
				}
				if (!canMatchEmpty(element)) {
					return;
				}
			} else if (
				element.type === "CapturingGroup" ||
				element.type === "Group"
			) {
				for (const innerAlternative of element.alternatives) {
					walkAlternative(innerAlternative);
				}
				if (!canMatchEmpty(element)) {
					return;
				}
			} else if (!canMatchEmpty(element)) {
				return;
			}
		}
	}

	for (const alternative of pattern.alternatives) {
		walkAlternative(alternative);
	}

	return quantifiers;
}

function generateAttackString(quantifier: Quantifier): string {
	const element = quantifier.element;
	let char = "a";

	if (element.type === "Character") {
		char = String.fromCharCode(element.value);
	} else if (element.type === "CharacterSet") {
		if (element.kind === "any") {
			char = "x";
		} else if (element.kind === "digit") {
			char = "0";
		} else if (element.kind === "space") {
			char = " ";
		} else if (element.kind === "word") {
			char = "a";
		} else {
			char = "a";
		}
	} else if (element.type === "CharacterClass") {
		const first = element.elements[0];
		if (first?.type === "Character") {
			char = String.fromCharCode(first.value);
		}
	}

	return char.repeat(20);
}

function getFollowingElements(quantifier: Quantifier): Element[] {
	const following: Element[] = [];
	const parent = quantifier.parent;
	const index = parent.elements.indexOf(quantifier);

	for (let i = index + 1; i < parent.elements.length; i++) {
		const element = parent.elements[i];
		if (element) {
			following.push(element);
		}
	}

	const grandparent = parent.parent;
	if (grandparent.type === "CapturingGroup" || grandparent.type === "Group") {
		const groupParent = grandparent.parent;
		if (groupParent.type === "Alternative") {
			const groupIndex = groupParent.elements.indexOf(grandparent);
			for (let i = groupIndex + 1; i < groupParent.elements.length; i++) {
				const element = groupParent.elements[i];
				if (element) {
					following.push(element);
				}
			}
		}
	}

	return following;
}

function hasRejectingSuffix(quantifier: Quantifier): boolean {
	const following = getFollowingElements(quantifier);
	return following.some(canReject);
}

function isAnchoredAtStart(pattern: Pattern): boolean {
	return pattern.alternatives.every((alternative) => {
		const first = alternative.elements[0];
		return first?.type === "Assertion" && first.kind === "start";
	});
}

function isMatchAll(characterClass: RegExpAST.CharacterClass): boolean {
	if (characterClass.negate) {
		return characterClass.elements.length === 0;
	}
	return false;
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
				"This quantifier can cause quadratic regex matching time. An input like '{{ attack }}' could trigger slow matching.",
			secondary: [
				"When a quantifier at the start of a pattern is followed by elements that can fail to match, the regex engine may try the pattern from each position in the input string.",
				"For an input of length n, this can result in O(n²) time complexity.",
			],
			suggestions: [
				"Anchor the pattern with ^ to prevent repeated matching attempts.",
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
			if (!regexpAst) {
				return;
			}

			if (isAnchoredAtStart(regexpAst)) {
				return;
			}

			const reachableQuantifiers = findReachableQuantifiers(regexpAst);

			for (const quantifier of reachableQuantifiers) {
				if (hasRejectingSuffix(quantifier)) {
					const attack = generateAttackString(quantifier);
					context.report({
						data: {
							attack,
						},
						message: "superLinear",
						range: {
							begin: patternStart + quantifier.start,
							end: patternStart + quantifier.end,
						},
					});
				}
			}
		}

		function checkRegexLiteral(
			node: AST.RegularExpressionLiteral,
			{ sourceFile }: { sourceFile: ts.SourceFile },
		) {
			const text = node.getText(sourceFile);
			const match = /^\/(.*)\/([dgimsuyv]*)$/.exec(text);

			if (!match) {
				return;
			}

			const [, pattern, flags] = match;

			if (!pattern) {
				return;
			}

			const nodeStart = node.getStart(sourceFile);
			checkPattern(pattern, nodeStart + 1, flags ?? "");
		}

		function checkRegExpConstructor(
			node: AST.CallExpression | AST.NewExpression,
			{ sourceFile }: { sourceFile: ts.SourceFile },
		) {
			if (
				node.expression.kind !== ts.SyntaxKind.Identifier ||
				node.expression.text !== "RegExp"
			) {
				return;
			}

			const args = node.arguments;
			if (!args?.length) {
				return;
			}

			const firstArgument = args[0];

			if (
				!firstArgument ||
				firstArgument.kind !== ts.SyntaxKind.StringLiteral
			) {
				return;
			}

			const patternStart = firstArgument.getStart(sourceFile) + 1;

			let flags = "";
			const secondArgument = args[1];
			if (secondArgument?.kind === ts.SyntaxKind.StringLiteral) {
				flags = secondArgument.text;
			}

			checkPattern(firstArgument.text, patternStart, flags);
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
