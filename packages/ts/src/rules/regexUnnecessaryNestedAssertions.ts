import {
	type AST,
	type TypeScriptFileServices,
	typescriptLanguage,
} from "@flint.fyi/typescript-language";

import { ruleCreator } from "./ruleCreator.ts";
import { getRegExpConstruction } from "./utils/getRegExpConstruction.ts";
import { getRegExpLiteralDetails } from "./utils/getRegExpLiteralDetails.ts";

interface Finding {
	end: number;
	innerRaw: string;
	outerRaw: string;
	start: number;
}

const lookaheadOpeners = ["(?=", "(?!"];
const lookbehindOpeners = ["(?<=", "(?<!"];
const allLookaroundOpeners = [...lookaheadOpeners, ...lookbehindOpeners];

function findCharacterClassEnd(pattern: string, startIndex: number) {
	let index = startIndex + 1;

	while (index < pattern.length) {
		if (pattern[index] === "\\") {
			index += 2;
			continue;
		}

		if (pattern[index] === "]") {
			return index;
		}

		index++;
	}

	return -1;
}

function findMatchingParen(pattern: string, startIndex: number) {
	let depth = 1;
	let index = startIndex;

	while (index < pattern.length && depth > 0) {
		if (pattern[index] === "\\") {
			index += 2;
			continue;
		}

		if (pattern[index] === "[") {
			const closeIndex = findCharacterClassEnd(pattern, index);
			if (closeIndex === -1) {
				return -1;
			}

			index = closeIndex + 1;
			continue;
		}

		if (pattern[index] === "(") {
			depth++;
		} else if (pattern[index] === ")") {
			depth--;
		}

		if (depth > 0) {
			index++;
		}
	}

	return depth === 0 ? index : -1;
}

function findTriviallyNestedAssertions(
	pattern: string,
	doubleEscaped: boolean,
) {
	const findings: Finding[] = [];
	const anchorPattern = doubleEscaped
		? /^(?:\^|\$|\\\\b)$/i
		: /^(?:\^|\$|\\b)$/i;

	let index = 0;
	while (index < pattern.length) {
		if (pattern[index] === "[") {
			const closeIndex = findCharacterClassEnd(pattern, index);
			if (closeIndex === -1) {
				break;
			}

			index = closeIndex + 1;
			continue;
		}

		if (
			pattern[index] === "\\" ||
			(doubleEscaped && pattern.slice(index, index + 2) === "\\\\")
		) {
			index +=
				doubleEscaped && pattern.slice(index, index + 2) === "\\\\" ? 2 : 2;
			continue;
		}

		const opener = allLookaroundOpeners.find(
			(lookaround) =>
				pattern.slice(index, index + lookaround.length) === lookaround,
		);
		if (!opener) {
			index++;
			continue;
		}

		const outerStart = index;
		const contentStart = index + opener.length;
		const closeIndex = findMatchingParen(pattern, contentStart);
		if (closeIndex === -1) {
			index++;
			continue;
		}

		const outerEnd = closeIndex + 1;

		if (hasQuantifierAfter(pattern, outerEnd)) {
			index++;
			continue;
		}

		const content = pattern.slice(contentStart, closeIndex);

		if (hasTopLevelAlternation(content, doubleEscaped)) {
			index++;
			continue;
		}

		if (anchorPattern.test(content)) {
			findings.push({
				end: outerEnd,
				innerRaw: content,
				outerRaw: pattern.slice(outerStart, outerEnd),
				start: outerStart,
			});
			index = outerEnd;
			continue;
		}

		const innerOpener = allLookaroundOpeners.find((lookaround) =>
			content.startsWith(lookaround),
		);
		if (innerOpener) {
			const isOuterLookahead = lookaheadOpeners.includes(opener);
			const isInnerLookahead = lookaheadOpeners.includes(innerOpener);

			if (isOuterLookahead === isInnerLookahead) {
				const innerContentStart = innerOpener.length;
				const innerCloseIndex = findMatchingParen(content, innerContentStart);

				if (
					innerCloseIndex !== -1 &&
					innerCloseIndex === content.length - 1 &&
					!hasQuantifierAfter(content, innerCloseIndex + 1)
				) {
					findings.push({
						end: outerEnd,
						innerRaw: content,
						outerRaw: pattern.slice(outerStart, outerEnd),
						start: outerStart,
					});
				}
			}
		}

		index = outerEnd;
	}

	return findings;
}

function hasQuantifierAfter(pattern: string, index: number) {
	const nextChar = pattern[index];
	return (
		nextChar === "*" || nextChar === "+" || nextChar === "?" || nextChar === "{"
	);
}

function hasTopLevelAlternation(content: string, doubleEscaped: boolean) {
	let depth = 0;
	let index = 0;

	while (index < content.length) {
		const char = content[index];

		if (char === "\\") {
			index += doubleEscaped && content[index + 1] === "\\" ? 3 : 2;
			continue;
		}

		if (char === "[") {
			const closeIndex = findCharacterClassEnd(content, index);
			if (closeIndex === -1) {
				return false;
			}

			index = closeIndex + 1;
			continue;
		}

		if (char === "(") {
			depth++;
		} else if (char === ")") {
			depth--;
		} else if (char === "|" && depth === 0) {
			return true;
		}

		index++;
	}

	return false;
}

export default ruleCreator.createRule(typescriptLanguage, {
	about: {
		description:
			"Reports trivially nested assertions in regular expressions that can be simplified.",
		id: "regexUnnecessaryNestedAssertions",
		presets: ["logical"],
	},
	messages: {
		unnecessaryNesting: {
			primary:
				"The lookaround '{{ outer }}' trivially wraps the assertion '{{ inner }}' and can be simplified.",
			secondary: [
				"Use the inner assertion directly instead of wrapping it in a lookaround.",
			],
			suggestions: ["Replace the lookaround with the inner assertion."],
		},
	},
	setup(context) {
		function checkRegexLiteral(
			node: AST.RegularExpressionLiteral,
			services: TypeScriptFileServices,
		) {
			const { pattern, start } = getRegExpLiteralDetails(node, services);
			const findings = findTriviallyNestedAssertions(pattern, false);

			for (const finding of findings) {
				context.report({
					data: {
						inner: finding.innerRaw,
						outer: finding.outerRaw,
					},
					fix: {
						range: {
							begin: start + finding.start,
							end: start + finding.end,
						},
						text: finding.innerRaw,
					},
					message: "unnecessaryNesting",
					range: {
						begin: start + finding.start,
						end: start + finding.end,
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

			const findings = findTriviallyNestedAssertions(
				construction.pattern,
				true,
			);

			for (const finding of findings) {
				context.report({
					data: {
						inner: finding.innerRaw,
						outer: finding.outerRaw,
					},
					fix: {
						range: {
							begin: construction.start + 1 + finding.start,
							end: construction.start + 1 + finding.end,
						},
						text: finding.innerRaw,
					},
					message: "unnecessaryNesting",
					range: {
						begin: construction.start + 1 + finding.start,
						end: construction.start + 1 + finding.end,
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
