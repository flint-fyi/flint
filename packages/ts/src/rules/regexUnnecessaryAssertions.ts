import {
	type AST,
	type TypeScriptFileServices,
	typescriptLanguage,
} from "@flint.fyi/typescript-language";

import { ruleCreator } from "./ruleCreator.ts";
import { getRegExpConstruction } from "./utils/getRegExpConstruction.ts";
import { getRegExpLiteralDetails } from "./utils/getRegExpLiteralDetails.ts";

interface Finding {
	assertionRaw: string;
	end: number;
	start: number;
	type: "endAnchor" | "negatedWordBoundary" | "startAnchor" | "wordBoundary";
	wordType?: "non-word" | "word";
}

function findUnnecessaryAssertions(
	pattern: string,
	doubleEscaped: boolean,
	flags: string,
) {
	const findings: Finding[] = [];
	const hasMultiline = flags.includes("m");

	const wordBoundaryRegex = doubleEscaped ? /\\\\b/g : /\\b/g;
	const negatedWordBoundaryRegex = doubleEscaped ? /\\\\B/g : /\\B/g;

	let match: null | RegExpExecArray;
	while ((match = wordBoundaryRegex.exec(pattern)) !== null) {
		const assertionStart = match.index;
		const assertionEnd = match.index + match[0].length;

		if (isInsideCharacterClass(pattern, assertionStart)) {
			continue;
		}

		const characterBefore = getCharBeforeAssertion(
			pattern,
			assertionStart,
			doubleEscaped,
		);
		const characterAfter = getCharAfterAssertion(
			pattern,
			assertionEnd,
			doubleEscaped,
		);

		if (characterBefore === undefined || characterAfter === undefined) {
			continue;
		}

		const beforeIsWord = isWordCharacter(characterBefore);
		const afterIsWord = isWordCharacter(characterAfter);

		if (beforeIsWord === undefined || afterIsWord === undefined) {
			continue;
		}

		if (beforeIsWord === afterIsWord) {
			findings.push({
				assertionRaw: match[0],
				end: assertionEnd,
				start: assertionStart,
				type: "wordBoundary",
				wordType: beforeIsWord ? "word" : "non-word",
			});
		}
	}

	while ((match = negatedWordBoundaryRegex.exec(pattern)) !== null) {
		const assertionStart = match.index;
		const assertionEnd = match.index + match[0].length;

		if (isInsideCharacterClass(pattern, assertionStart)) {
			continue;
		}

		const characterBefore = getCharBeforeAssertion(
			pattern,
			assertionStart,
			doubleEscaped,
		);
		const characterAfter = getCharAfterAssertion(
			pattern,
			assertionEnd,
			doubleEscaped,
		);

		if (characterBefore === undefined || characterAfter === undefined) {
			continue;
		}

		const beforeIsWord = isWordCharacter(characterBefore);
		const afterIsWord = isWordCharacter(characterAfter);

		if (beforeIsWord === undefined || afterIsWord === undefined) {
			continue;
		}

		if (beforeIsWord !== afterIsWord) {
			findings.push({
				assertionRaw: match[0],
				end: assertionEnd,
				start: assertionStart,
				type: "negatedWordBoundary",
			});
		}
	}

	if (!hasMultiline) {
		const startAnchorRegex = doubleEscaped ? /(?<!\\)\^/g : /(?<!\\)\^/g;
		const endAnchorRegex = doubleEscaped ? /(?<!\\)\$/g : /(?<!\\)\$/g;

		while ((match = startAnchorRegex.exec(pattern)) !== null) {
			const position = match.index;

			if (isInsideCharacterClass(pattern, position)) {
				continue;
			}

			if (doubleEscaped && position > 0 && pattern[position - 1] === "\\") {
				continue;
			}

			if (position > 0) {
				findings.push({
					assertionRaw: "^",
					end: position + 1,
					start: position,
					type: "startAnchor",
				});
			}
		}

		while ((match = endAnchorRegex.exec(pattern)) !== null) {
			const position = match.index;

			if (isInsideCharacterClass(pattern, position)) {
				continue;
			}

			if (doubleEscaped && position > 0 && pattern[position - 1] === "\\") {
				continue;
			}

			if (position < pattern.length - 1) {
				findings.push({
					assertionRaw: "$",
					end: position + 1,
					start: position,
					type: "endAnchor",
				});
			}
		}
	}

	return findings;
}

function getCharacterFromEscape(escape: string) {
	switch (escape) {
		case "\\\\d":
		case "\\d":
			return "0";

		case "\\\\D":
		case "\\D":
			return " ";

		case "\\\\s":
		case "\\s":
			return " ";

		case "\\\\S":
		case "\\S":
			return "a";

		case "\\\\w":
		case "\\w":
			return "a";

		case "\\\\W":
		case "\\W":
			return " ";

		default:
			return undefined;
	}
}

function getCharAfterAssertion(
	pattern: string,
	assertionEnd: number,
	doubleEscaped: boolean,
) {
	if (assertionEnd >= pattern.length) {
		return undefined;
	}

	const remaining = pattern.slice(assertionEnd);

	if (doubleEscaped && remaining.startsWith("\\\\")) {
		const twoCharEscape = remaining.slice(0, 3);
		const charResult = getCharacterFromEscape(twoCharEscape);
		if (charResult) {
			return charResult;
		}

		if (remaining.length >= 3 && remaining[2]) {
			return remaining[2];
		}

		return undefined;
	}

	if (!doubleEscaped && remaining.startsWith("\\")) {
		const twoCharEscape = remaining.slice(0, 2);
		const charResult = getCharacterFromEscape(twoCharEscape);
		if (charResult) {
			return charResult;
		}

		if (
			twoCharEscape === "\\b" ||
			twoCharEscape === "\\B" ||
			remaining.length < 1 ||
			!remaining[1]
		) {
			return undefined;
		}

		return remaining[1];
	}

	return remaining[0];
}

function getCharBeforeAssertion(
	pattern: string,
	assertionStart: number,
	doubleEscaped: boolean,
) {
	if (assertionStart <= 0) {
		return undefined;
	}

	if (doubleEscaped) {
		if (assertionStart >= 3 && pattern[assertionStart - 3] === "\\") {
			const seq = pattern.slice(assertionStart - 3, assertionStart);
			const charResult = getCharacterFromEscape(seq);
			if (charResult) {
				return charResult;
			}

			return pattern[assertionStart - 1];
		}

		return pattern[assertionStart - 1];
	}

	if (assertionStart >= 2 && pattern[assertionStart - 2] === "\\") {
		const seq = pattern.slice(assertionStart - 2, assertionStart);
		const charResult = getCharacterFromEscape(seq);
		if (charResult) {
			return charResult;
		}

		return pattern[assertionStart - 1];
	}

	return pattern[assertionStart - 1];
}

function isInsideCharacterClass(pattern: string, position: number) {
	let inClass = false;
	let escaped = false;
	for (let index = 0; index < position; index++) {
		const char = pattern[index];
		if (escaped) {
			escaped = false;
			continue;
		}
		if (char === "\\") {
			escaped = true;
			continue;
		}
		if (char === "[" && !inClass) {
			inClass = true;
			continue;
		}
		if (char === "]" && inClass) {
			inClass = false;
		}
	}
	return inClass;
}

function isWordCharacter(character: string | undefined) {
	return character ? /^\w$/.test(character) : undefined;
}

export default ruleCreator.createRule(typescriptLanguage, {
	about: {
		description:
			"Reports assertions in regular expressions that always reject.",
		id: "regexUnnecessaryAssertions",
		presets: ["logical"],
	},
	messages: {
		endAnchor: {
			primary:
				"The end anchor `$` always rejects because it is not at the end of the pattern.",
			secondary: [
				"Without the `m` (multiline) flag, `$` can only match at the very end of the input string.",
				"Characters after `$` mean the pattern can never match.",
			],
			suggestions: [
				"Remove the `$` anchor.",
				"Move the `$` to the end of the pattern.",
				"Add the `m` flag if you want `$` to match at line endings.",
			],
		},
		negatedWordBoundary: {
			primary:
				"The negated word boundary `\\B` always rejects because there is a word/non-word transition.",
			secondary: [
				"`\\B` asserts that the position is NOT at a word boundary.",
				"However, the surrounding characters already create a word/non-word transition, which is a word boundary.",
			],
			suggestions: [
				"Remove the `\\B` assertion.",
				"Use `\\b` if you intended to match a word boundary.",
			],
		},
		startAnchor: {
			primary:
				"The start anchor `^` always rejects because it is not at the start of the pattern.",
			secondary: [
				"Without the `m` (multiline) flag, `^` can only match at the very beginning of the input string.",
				"Characters before `^` mean the pattern can never match.",
			],
			suggestions: [
				"Remove the `^` anchor.",
				"Move the `^` to the start of the pattern.",
				"Add the `m` flag if you want `^` to match at line beginnings.",
			],
		},
		wordBoundary: {
			primary:
				"The word boundary `\\b` always rejects because both sides are {{ type }} characters.",
			secondary: [
				"`\\b` asserts that the position is at a word boundary (between a word and non-word character).",
				"Since both adjacent characters are {{ type }} characters, there is no boundary here.",
			],
			suggestions: [
				"Remove the `\\b` assertion.",
				"Use `\\B` if you intended to match inside a word.",
			],
		},
	},
	setup(context) {
		function checkRegexLiteral(
			node: AST.RegularExpressionLiteral,
			services: TypeScriptFileServices,
		) {
			const { flags, pattern, start } = getRegExpLiteralDetails(node, services);
			const findings = findUnnecessaryAssertions(pattern, false, flags);

			for (const finding of findings) {
				context.report({
					data: {
						type: finding.wordType ?? "",
					},
					message: finding.type,
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

			const findings = findUnnecessaryAssertions(
				construction.pattern,
				true,
				construction.flags,
			);

			for (const finding of findings) {
				context.report({
					data: {
						type: finding.wordType ?? "",
					},
					message: finding.type,
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
