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

function getRangeReplacement(range: UnnecessaryRange): string {
	if (range.type === "identity") {
		// For [a-a], replace with just [a]
		return range.node.min.raw;
	}
	// For [a-b], replace with [ab]
	return range.node.min.raw + range.node.max.raw;
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
			primary: "This two-character range can be simplified to omit the hyphen.",
			secondary: [
				"A range like `[a-b]` can be written as `[ab]` without the hyphen.",
			],
			suggestions: ["Replace the range with the two characters directly."],
		},
		identity: {
			primary:
				"This single-character range can be simplified to just the character.",
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
				const beginPos = start + range.node.start - 1;
				const endPos = start + range.node.end - 1;

				context.report({
					fix: {
						range: {
							begin: beginPos,
							end: endPos,
						},
						text: getRangeReplacement(range),
					},
					message: range.type,
					range: {
						begin: beginPos,
						end: endPos,
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
				const beginPos = construction.start + range.node.start;
				const endPos = construction.start + range.node.end;

				context.report({
					fix: {
						range: {
							begin: beginPos,
							end: endPos,
						},
						text: getRangeReplacement(range),
					},
					message: range.type,
					range: {
						begin: beginPos,
						end: endPos,
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
