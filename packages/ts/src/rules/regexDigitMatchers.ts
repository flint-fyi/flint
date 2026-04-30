import { parseRegExpLiteral, visitRegExpAST } from "@eslint-community/regexpp";
import type {
	Character,
	CharacterClass,
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

interface AllowedRange {
	max: number;
	min: number;
}

interface CharacterGroup {
	max: Character;
	min: Character;
	nodes: (Character | CharacterClassRange)[];
}

interface Issue {
	end: number;
	newText: string;
	nodeRanges: { end: number; start: number }[];
	start: number;
}

const ALLOWED_RANGES: AllowedRange[] = [
	{ max: 0x39, min: 0x30 }, // 0-9
	{ max: 0x5a, min: 0x41 }, // A-Z
	{ max: 0x7a, min: 0x61 }, // a-z
];

function checkInAllowedRange(
	value: number,
	rangeMin?: number,
	rangeMax?: number,
): boolean {
	const min = rangeMin ?? value;
	const max = rangeMax ?? value;
	return ALLOWED_RANGES.some((r) => r.min <= min && max <= r.max);
}

function findIssues(pattern: string, flags: string): Issue[] {
	const issues: Issue[] = [];

	let ast: RegExpLiteral;
	try {
		ast = parseRegExpLiteral(new RegExp(pattern, flags));
	} catch {
		return issues;
	}

	visitRegExpAST(ast, {
		onCharacterClassEnter(ccNode: CharacterClass) {
			const groups: CharacterGroup[] = [];

			for (const element of ccNode.elements) {
				let data: { max: Character; min: Character };

				if (element.type === "Character") {
					if (checkInAllowedRange(element.value)) {
						data = { max: element, min: element };
					} else {
						continue;
					}
				} else if (element.type === "CharacterClassRange") {
					if (
						checkInAllowedRange(
							element.min.value,
							element.min.value,
							element.max.value,
						)
					) {
						data = { max: element.max, min: element.min };
					} else {
						continue;
					}
				} else {
					continue;
				}

				const group = groups.find((gp) => {
					const adjacent =
						gp.min.value - 1 <= data.max.value &&
						data.min.value <= gp.max.value + 1;
					if (!adjacent) {
						return false;
					}
					const min = Math.min(gp.min.value, data.min.value);
					const max = Math.max(gp.max.value, data.max.value);
					return checkInAllowedRange(min, min, max);
				});

				if (group) {
					if (data.min.value < group.min.value) {
						group.min = data.min;
					}
					if (group.max.value < data.max.value) {
						group.max = data.max;
					}
					group.nodes.push(element);
				} else {
					groups.push({
						...data,
						nodes: [element],
					});
				}
			}

			for (const group of groups) {
				const charCount = group.max.value - group.min.value + 1;
				if (charCount >= 4 && group.nodes.length > 1) {
					const newText = `${group.min.raw}-${group.max.raw}`;

					const nodeRanges: { end: number; start: number }[] = [];
					for (const node of group.nodes) {
						nodeRanges.push({ end: node.end, start: node.start });
					}
					nodeRanges.sort((a, b) => a.start - b.start);

					const mergedRanges: { end: number; start: number }[] = [];
					for (const range of nodeRanges) {
						const last = mergedRanges.at(-1);
						if (last && last.end >= range.start) {
							last.end = Math.max(last.end, range.end);
						} else {
							mergedRanges.push({ ...range });
						}
					}

					const firstMerged = mergedRanges[0];
					const lastMerged = mergedRanges.at(-1);
					if (firstMerged && lastMerged) {
						issues.push({
							end: lastMerged.end,
							newText,
							nodeRanges: mergedRanges,
							start: firstMerged.start,
						});
					}
				}
			}
		},
	});

	return issues;
}

function getRegexPattern(node: AST.RegularExpressionLiteral): {
	flags: string;
	pattern: string;
} {
	const text = node.text;
	const lastSlash = text.lastIndexOf("/");
	return {
		flags: text.slice(lastSlash + 1),
		pattern: text.slice(1, lastSlash),
	};
}

export default ruleCreator.createRule(typescriptLanguage, {
	about: {
		description:
			"Reports character classes with multiple adjacent characters that could use a range instead.",
		id: "regexDigitMatchers",
		presets: ["stylisticStrict"],
	},
	messages: {
		preferRange: {
			primary:
				"These multiple adjacent characters can be simplified to `{{ range }}` instead.",
			secondary: [
				"Character class ranges (e.g., `a-d`) are more concise and readable than listing multiple adjacent characters (e.g., `abcd`).",
			],
			suggestions: ["Replace adjacent characters with '{{ range }}'."],
		},
	},
	setup(context) {
		function checkRegexLiteral(
			node: AST.RegularExpressionLiteral,
			{ sourceFile }: TypeScriptFileServices,
		) {
			const { flags, pattern } = getRegexPattern(node);
			const issues = findIssues(pattern, flags);

			const nodeStart = node.getStart(sourceFile);

			for (const issue of issues) {
				const firstRange = issue.nodeRanges[0];
				if (!firstRange) {
					continue;
				}
				context.report({
					data: {
						range: issue.newText,
					},
					fix: issue.nodeRanges.map((range, index) => ({
						range: {
							begin: nodeStart + range.start,
							end: nodeStart + range.end,
						},
						text: index === 0 ? issue.newText : "",
					})),
					message: "preferRange",
					range: {
						begin: nodeStart + firstRange.start,
						end: nodeStart + firstRange.end,
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

			const { pattern, start } = construction;
			const unescapedPattern = pattern.replace(/\\\\/g, "\\");
			const issues = findIssues(unescapedPattern, construction.flags);

			function mapPositionToSource(pos: number): number {
				let sourcePos = 0;
				let patternPos = 0;
				while (patternPos < pos && sourcePos < pattern.length) {
					if (pattern[sourcePos] === "\\" && pattern[sourcePos + 1] === "\\") {
						sourcePos += 2;
					} else {
						sourcePos += 1;
					}
					patternPos += 1;
				}
				return sourcePos;
			}

			for (const issue of issues) {
				const adjustedRanges = issue.nodeRanges.map((range) => ({
					end: mapPositionToSource(range.end - 1),
					start: mapPositionToSource(range.start - 1),
				}));

				// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
				const firstRange = adjustedRanges[0]!;

				context.report({
					data: {
						range: issue.newText.replace(/\\/g, "\\\\"),
					},
					fix: adjustedRanges.map((range, index) => ({
						range: {
							begin: start + 1 + range.start,
							end: start + 1 + range.end,
						},
						text: index === 0 ? issue.newText.replace(/\\/g, "\\\\") : "",
					})),
					message: "preferRange",
					range: {
						begin: start + 1 + firstRange.start,
						end: start + 1 + firstRange.end,
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
