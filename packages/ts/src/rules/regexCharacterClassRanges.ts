import {
	type AST as RegExpAST,
	visitRegExpAST,
} from "@eslint-community/regexpp";
import {
	getTSNodeRange,
	typescriptLanguage,
} from "@flint.fyi/typescript-language";

import { ruleCreator } from "./ruleCreator.ts";
import { parseRegexpAst } from "./utils/parseRegexpAst.ts";

interface CharacterGroup {
	max: { raw: string; value: number };
	min: { raw: string; value: number };
	nodes: (RegExpAST.Character | RegExpAST.CharacterClassRange)[];
}

interface CharRange {
	max: number;
	min: number;
}

interface ProcessResult {
	newRange: string;
	nodes: (RegExpAST.Character | RegExpAST.CharacterClassRange)[];
}

const ALPHANUMERIC_RANGES: readonly CharRange[] = [
	{ max: 57, min: 48 },
	{ max: 90, min: 65 },
	{ max: 122, min: 97 },
];

function inRange(ranges: readonly CharRange[], min: number, max = min) {
	for (const range of ranges) {
		if (range.min <= min && max <= range.max) {
			return true;
		}
	}
	return false;
}

function processCharacterClass(
	node: RegExpAST.CharacterClass,
): ProcessResult | undefined {
	const groups: CharacterGroup[] = [];

	for (const element of node.elements) {
		let data: {
			max: { raw: string; value: number };
			min: { raw: string; value: number };
			node: RegExpAST.Character | RegExpAST.CharacterClassRange;
		};

		if (element.type === "Character") {
			if (!inRange(ALPHANUMERIC_RANGES, element.value)) {
				continue;
			}
			data = {
				max: { raw: element.raw, value: element.value },
				min: { raw: element.raw, value: element.value },
				node: element,
			};
		} else if (element.type === "CharacterClassRange") {
			if (!inRange(ALPHANUMERIC_RANGES, element.min.value, element.max.value)) {
				continue;
			}
			data = {
				max: { raw: element.max.raw, value: element.max.value },
				min: { raw: element.min.raw, value: element.min.value },
				node: element,
			};
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

			return inRange(ALPHANUMERIC_RANGES, min, max);
		});

		if (group) {
			if (data.min.value < group.min.value) {
				group.min = data.min;
			}
			if (group.max.value < data.max.value) {
				group.max = data.max;
			}
			group.nodes.push(data.node);
		} else {
			groups.push({
				max: data.max,
				min: data.min,
				nodes: [data.node],
			});
		}
	}

	for (const group of groups) {
		const charCount = group.max.value - group.min.value + 1;
		if (charCount >= 4 && group.nodes.length > 1) {
			const newRange = `${group.min.raw}-${group.max.raw}`;
			return { newRange, nodes: group.nodes };
		}
	}

	return undefined;
}

export default ruleCreator.createRule(typescriptLanguage, {
	about: {
		description:
			"Reports character class elements that can be simplified to ranges.",
		id: "regexCharacterClassRanges",
		presets: ["stylistic"],
	},
	messages: {
		preferRange: {
			primary:
				"Multiple adjacent characters can be simplified to a range '{{ range }}'.",
			secondary: [
				"Character class ranges are more concise and readable than listing individual characters.",
			],
			suggestions: ["Replace the characters with the range '{{ range }}'."],
		},
	},
	setup(context) {
		return {
			visitors: {
				RegularExpressionLiteral: (node, { sourceFile }) => {
					const text = node.getText(sourceFile);
					const match = /^\/(.+)\/([dgimsuyv]*)$/.exec(text);

					if (!match) {
						return;
					}

					const [, pattern, flags] = match;

					if (!pattern) {
						return;
					}

					const regexpAst = parseRegexpAst(pattern, flags);
					if (!regexpAst) {
						return;
					}

					const nodeStart = node.getStart(sourceFile);
					const patternOffset = 1;

					visitRegExpAST(regexpAst, {
						onCharacterClassEnter(ccNode) {
							const result = processCharacterClass(ccNode);
							if (result) {
								const sortedNodes = [...result.nodes].sort(
									(a, b) => a.start - b.start,
								);

								const firstNode = sortedNodes[0];
								const lastNode = sortedNodes.at(-1);

								if (!firstNode || !lastNode) {
									return;
								}

								const fixRanges: { begin: number; end: number }[] = [];

								for (const currentNode of sortedNodes) {
									const begin = nodeStart + patternOffset + currentNode.start;
									const end = nodeStart + patternOffset + currentNode.end;

									if (fixRanges.length === 0) {
										fixRanges.push({ begin, end });
									} else {
										const lastRange = fixRanges.at(-1);
										if (lastRange && lastRange.end >= begin) {
											lastRange.end = Math.max(lastRange.end, end);
										} else {
											fixRanges.push({ begin, end });
										}
									}
								}

								context.report({
									data: {
										range: result.newRange,
									},
									fix: fixRanges.map((range, index) => ({
										range,
										text: index === 0 ? result.newRange : "",
									})),
									message: "preferRange",
									range: getTSNodeRange(node, sourceFile),
								});
							}
						},
					});
				},
			},
		};
	},
});
