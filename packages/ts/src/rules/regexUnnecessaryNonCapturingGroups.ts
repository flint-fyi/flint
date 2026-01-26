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

function canUnwrap(group: RegExpAST.Group, pattern: string): boolean {
	const groupStart = group.start;

	const alternative = group.alternatives[0];
	if (!alternative || alternative.elements.length === 0) {
		return true;
	}

	const firstElement = alternative.elements[0];

	if (!firstElement) {
		return true;
	}

	const firstChar = pattern[firstElement.start];

	if (!firstChar) {
		return true;
	}

	if (groupStart >= 3) {
		const threeCharsBefore = pattern.slice(groupStart - 3, groupStart);
		const thirdChar = threeCharsBefore[2];

		if (
			thirdChar &&
			threeCharsBefore.startsWith("\\") &&
			threeCharsBefore[1] === "x" &&
			isHexDigit(thirdChar)
		) {
			if (isHexDigit(firstChar)) {
				return false;
			}
		}

		if (
			thirdChar &&
			threeCharsBefore.startsWith("\\") &&
			threeCharsBefore[1] === "c" &&
			isLetter(thirdChar)
		) {
			return false;
		}
	}

	if (groupStart >= 2) {
		const twoCharsBefore = pattern.slice(groupStart - 2, groupStart);

		if (twoCharsBefore.startsWith("\\") && twoCharsBefore[1] === "c") {
			if (isLetter(firstChar)) {
				return false;
			}
		}
	}

	if (groupStart >= 1) {
		const charBeforeGroup = pattern[groupStart - 1];

		if (charBeforeGroup && isDigit(charBeforeGroup)) {
			const backslashIndex = pattern.lastIndexOf("\\", groupStart - 1);
			if (backslashIndex >= 0) {
				const between = pattern.slice(backslashIndex + 1, groupStart);
				if (/^\d+$/.test(between) && isDigit(firstChar)) {
					return false;
				}
			}
		}

		if (charBeforeGroup === "{" && alternative.elements.length > 0) {
			const lastElement = alternative.elements[alternative.elements.length - 1];
			const charAfterGroup =
				group.end < pattern.length ? pattern[group.end] : undefined;
			const lastChar = lastElement ? pattern[lastElement.end - 1] : undefined;

			if (isDigit(firstChar) && (charAfterGroup === "}" || lastChar === "}")) {
				return false;
			}
		}
	}

	return true;
}

function isDigit(char: string): boolean {
	return /^\d$/.test(char);
}

function isHexDigit(char: string): boolean {
	return /^[0-9a-f]$/i.test(char);
}

function isLetter(char: string): boolean {
	return /^[a-z]$/i.test(char);
}

function isUnnecessaryGroup(group: RegExpAST.Group, pattern: string): boolean {
	const parent = group.parent;
	const alternatives = group.alternatives;
	const firstAlternative = alternatives[0];

	if (!firstAlternative) {
		return false;
	}

	if (alternatives.length === 1) {
		const elements = firstAlternative.elements;

		if (parent.type === "Quantifier") {
			if (elements.length !== 1) {
				return false;
			}

			const singleElement = elements[0];

			if (!singleElement) {
				return false;
			}

			if (singleElement.type === "Quantifier") {
				return false;
			}

			if (singleElement.type === "Assertion") {
				return false;
			}

			return canUnwrap(group, pattern);
		}

		return canUnwrap(group, pattern);
	}

	if (parent.type === "Quantifier") {
		return false;
	}

	if (parent.elements.length !== 1) {
		return false;
	}

	return canUnwrap(group, pattern);
}

export default ruleCreator.createRule(typescriptLanguage, {
	about: {
		description:
			"Reports non-capturing groups that can be removed without changing the meaning of the regex.",
		id: "regexUnnecessaryNonCapturingGroups",
		presets: ["stylistic"],
	},
	messages: {
		unnecessaryGroup: {
			primary: "Remove unnecessary non-capturing group.",
			secondary: [
				"This non-capturing group can be removed without changing the regex behavior.",
			],
			suggestions: ["Remove the group delimiters (?:...)."],
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
				onGroupEnter(group) {
					if (isUnnecessaryGroup(group, pattern)) {
						context.report({
							message: "unnecessaryGroup",
							range: {
								begin: patternStart + group.start,
								end: patternStart + group.end,
							},
						});
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
