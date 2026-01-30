import {
	parseRegExpLiteral,
	type AST as RegExpAST,
	visitRegExpAST,
} from "@eslint-community/regexpp";
import {
	type AST,
	type TypeScriptFileServices,
	typescriptLanguage,
} from "@flint.fyi/typescript-language";

import { ruleCreator } from "./ruleCreator.ts";
import { getRegExpConstruction } from "./utils/getRegExpConstruction.ts";
import { getRegExpLiteralDetails } from "./utils/getRegExpLiteralDetails.ts";

interface Issue {
	duplicate: RegExpAST.Character | RegExpAST.CharacterClassRange;
	end: number;
	original: RegExpAST.Character | RegExpAST.CharacterClassRange;
	start: number;
}

function adjustPositionForEscapes(escaped: string, unescapedPos: number) {
	let escapedIndex = 0;
	let unescapedIndex = 0;

	while (unescapedIndex < unescapedPos && escapedIndex < escaped.length) {
		if (escaped[escapedIndex] === "\\" && escaped[escapedIndex + 1] === "\\") {
			escapedIndex += 2;
		} else {
			escapedIndex += 1;
		}
		unescapedIndex += 1;
	}

	return escapedIndex;
}

function findDuplicatesInCharacterClass(
	characterClass: RegExpAST.CharacterClass,
) {
	const issues: Issue[] = [];
	const seenCharacters = new Map<number, RegExpAST.Character>();
	const seenRanges: RegExpAST.CharacterClassRange[] = [];

	for (const element of characterClass.elements) {
		switch (element.type) {
			case "Character": {
				const existing = seenCharacters.get(element.value);
				if (existing) {
					issues.push({
						duplicate: element,
						end: element.end,
						original: existing,
						start: element.start,
					});
				} else {
					seenCharacters.set(element.value, element);
				}
				break;
			}

			case "CharacterClassRange": {
				const duplicateRange = seenRanges.find(
					(range) =>
						range.min.value === element.min.value &&
						range.max.value === element.max.value,
				);
				if (duplicateRange) {
					issues.push({
						duplicate: element,
						end: element.end,
						original: duplicateRange,
						start: element.start,
					});
				} else {
					seenRanges.push(element);
				}
				break;
			}
		}
	}

	for (const [value, element] of seenCharacters) {
		for (const range of seenRanges) {
			if (value >= range.min.value && value <= range.max.value) {
				const alreadyReported = issues.some(
					(issue) => issue.duplicate === element,
				);
				if (!alreadyReported) {
					issues.push({
						duplicate: element,
						end: element.end,
						original: range,
						start: element.start,
					});
				}
			}
		}
	}

	return issues;
}

function findIssues(pattern: string, flags: string) {
	const issues: Issue[] = [];

	let ast: RegExpAST.RegExpLiteral;
	try {
		ast = parseRegExpLiteral(new RegExp(pattern, flags));
	} catch {
		return issues;
	}

	visitRegExpAST(ast, {
		onCharacterClassEnter(ccNode: RegExpAST.CharacterClass) {
			const duplicates = findDuplicatesInCharacterClass(ccNode);
			issues.push(...duplicates);
		},
	});

	return issues;
}

export default ruleCreator.createRule(typescriptLanguage, {
	about: {
		description:
			"Reports duplicate characters in regular expression character classes.",
		id: "regexDuplicateCharacterClassCharacters",
		presets: ["logical", "logicalStrict"],
	},
	messages: {
		duplicate: {
			primary: "Duplicate character '{{ character }}' in character class.",
			secondary: [
				"This character appears multiple times in the character class and only one occurrence is needed.",
			],
			suggestions: ["Remove the duplicate character."],
		},
		includedInRange: {
			primary:
				"Character '{{ character }}' is already included in range '{{ range }}'.",
			secondary: [
				"This character is redundant because it falls within the specified range.",
			],
			suggestions: ["Remove the redundant character."],
		},
	},
	setup(context) {
		function checkPattern(flags: string, pattern: string, start: number) {
			const issues = findIssues(pattern, flags);

			for (const issue of issues) {
				const isCharacterInRange =
					issue.duplicate.type === "Character" &&
					issue.original.type === "CharacterClassRange";
				const adjustedStart = adjustPositionForEscapes(
					pattern,
					issue.start - 1,
				);
				const adjustedEnd = adjustPositionForEscapes(pattern, issue.end - 1);
				const [message, range] = isCharacterInRange
					? (["includedInRange", issue.original.raw] as const)
					: (["duplicate", ""] as const);

				context.report({
					data: {
						character: issue.duplicate.raw,
						range,
					},
					message,
					range: {
						begin: start + 1 + adjustedStart,
						end: start + 1 + adjustedEnd,
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

			const patternUnescaped = construction.pattern.replace(/\\\\/g, "\\");
			checkPattern(construction.flags, patternUnescaped, construction.start);
		}

		function checkRegexLiteral(
			node: AST.RegularExpressionLiteral,
			services: TypeScriptFileServices,
		) {
			const details = getRegExpLiteralDetails(node, services);
			checkPattern(details.flags, details.pattern, details.start - 1);
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
