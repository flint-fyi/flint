import { parseRegExpLiteral, visitRegExpAST } from "@eslint-community/regexpp";
import type {
	CharacterClassRange,
	RegExpLiteral,
} from "@eslint-community/regexpp/ast";
import {
	type AST,
	type TypeScriptFileServices,
	typescriptLanguage,
} from "@flint.fyi/typescript-language";

import { ruleCreator } from "./ruleCreator.ts";
import { getRegExpConstruction } from "./utils/getRegExpConstruction.ts";
import { getRegExpLiteralDetails } from "./utils/getRegExpLiteralDetails.ts";

type RangeType = "adjacent" | "identity";

interface UnnecessaryRange {
	node: CharacterClassRange;
	type: RangeType;
}

function findUnnecessaryRanges(pattern: string, flags: string) {
	const results: UnnecessaryRange[] = [];

	let ast: RegExpLiteral;
	try {
		ast = parseRegExpLiteral(new RegExp(pattern, flags));
	} catch {
		return results;
	}

	visitRegExpAST(ast, {
		onCharacterClassRangeEnter(node: CharacterClassRange) {
			const rangeType = getUnnecessaryRangeType(node);
			if (rangeType) {
				results.push({ node, type: rangeType });
			}
		},
	});

	return results;
}

function getUnnecessaryRangeType(
	node: CharacterClassRange,
): RangeType | undefined {
	const min = node.min.value;
	const max = node.max.value;

	if (min === max) {
		return "identity";
	}
	if (min + 1 === max) {
		return "adjacent";
	}
	return undefined;
}

export default ruleCreator.createRule(typescriptLanguage, {
	about: {
		description:
			"Reports character class ranges that span only one or two characters.",
		id: "regexUnnecessaryCharacterRanges",
		presets: ["logical"],
	},
	messages: {
		adjacent: {
			primary: "This character range spans only two adjacent characters.",
			secondary: [
				"A range like `[a-b]` can be written as `[ab]` without the hyphen.",
			],
			suggestions: ["Replace the range with the two characters directly."],
		},
		identity: {
			primary: "This character range spans only one character.",
			secondary: ["A range like `[a-a]` can be simplified to just `[a]`."],
			suggestions: ["Remove the hyphen and duplicate character."],
		},
	},
	setup(context) {
		function checkRegexLiteral(
			node: AST.RegularExpressionLiteral,
			services: TypeScriptFileServices,
		) {
			const { flags, pattern, start } = getRegExpLiteralDetails(node, services);
			const unnecessaryRanges = findUnnecessaryRanges(pattern, flags);

			for (const range of unnecessaryRanges) {
				context.report({
					message: range.type,
					range: {
						begin: start + range.node.start - 1,
						end: start + range.node.end - 1,
					},
				});
			}
		}

		function checkRegExpConstructor(
			node: AST.CallExpression | AST.NewExpression,
			services: TypeScriptFileServices,
		) {
			const construction = getRegExpConstruction(node, services);
			if (!construction) {
				return;
			}

			const patternEscaped = construction.pattern.replace(/\\\\/g, "\\");
			const unnecessaryRanges = findUnnecessaryRanges(
				patternEscaped,
				construction.flags,
			);

			for (const range of unnecessaryRanges) {
				context.report({
					message: range.type,
					range: {
						begin: construction.start + range.node.start,
						end: construction.start + range.node.end,
					},
				});
			}
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
