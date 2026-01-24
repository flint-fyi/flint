import {
	type AST,
	type TypeScriptFileServices,
	typescriptLanguage,
} from "@flint.fyi/typescript-language";

import { ruleCreator } from "./ruleCreator.ts";
import { getRegExpConstruction } from "./utils/getRegExpConstruction.ts";
import { getRegExpLiteralDetails } from "./utils/getRegExpLiteralDetails.ts";

function findEmptyAlternativesInGroup(
	pattern: string,
	groupStart: number,
	groupEnd: number,
	results: number[],
) {
	let contentStart = groupStart;

	if (
		["?!", "?:", "?="].includes(pattern.slice(groupStart, groupStart + 2)) ||
		["?<!", "?<="].includes(pattern.slice(groupStart, groupStart + 3))
	) {
		if (pattern.slice(groupStart, groupStart + 3).startsWith("?<")) {
			contentStart = groupStart + 3;
		} else {
			contentStart = groupStart + 2;
		}
	} else if (pattern[groupStart] === "?" && pattern[groupStart + 1] === "<") {
		const closeAngle = pattern.indexOf(">", groupStart + 2);
		if (closeAngle !== -1 && closeAngle < groupEnd) {
			contentStart = closeAngle + 1;
		}
	}

	const pipePositions: number[] = [];

	for (let i = contentStart; i < groupEnd; i++) {
		const character = pattern[i];

		switch (character) {
			case "(": {
				const parenthesisEnd = findMatchingParenthesis(pattern, i);
				if (parenthesisEnd !== -1) {
					findEmptyAlternativesInGroup(pattern, i + 1, parenthesisEnd, results);
					i = parenthesisEnd;
				}
				break;
			}

			case "\\":
				i++;
				break;

			case "|":
				pipePositions.push(i);
				break;
		}
	}

	if (pipePositions.length === 0) {
		return;
	}

	const alternativeBoundaries: { end: number; start: number }[] = [];
	let currentStart = contentStart;

	for (const pipePos of pipePositions) {
		alternativeBoundaries.push({ end: pipePos, start: currentStart });
		currentStart = pipePos + 1;
	}

	alternativeBoundaries.push({ end: groupEnd, start: currentStart });

	for (let i = 0; i < alternativeBoundaries.length; i++) {
		const boundary = alternativeBoundaries[i];
		if (!boundary) {
			continue;
		}

		const { end, start } = boundary;

		if (isAlternativeEmpty(pattern, start, end)) {
			const isLast = i === alternativeBoundaries.length - 1;
			const lastPipePosition = pipePositions.at(-1);
			if (isLast && lastPipePosition === undefined) {
				continue;
			}

			// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
			results.push(isLast ? lastPipePosition! : start);
		}
	}
}

function findEmptyAlternativeStarts(pattern: string) {
	const emptyAlternativeStarts: number[] = [];

	findEmptyAlternativesInGroup(
		pattern,
		0,
		pattern.length,
		emptyAlternativeStarts,
	);

	return emptyAlternativeStarts;
}

function findMatchingParenthesis(pattern: string, openIndex: number) {
	let depth = 1;
	let charClassDepth = 0;

	for (let i = openIndex + 1; i < pattern.length; i++) {
		const char = pattern[i];

		if (char === "\\") {
			i++;
			continue;
		}

		if (charClassDepth > 0) {
			if (char === "]") {
				charClassDepth--;
			}

			continue;
		}

		if (char === "[") {
			charClassDepth++;
			continue;
		}

		if (char === "(") {
			depth++;
		} else if (char === ")") {
			depth--;
			if (depth === 0) {
				return i;
			}
		}
	}

	return -1;
}

function isAlternativeEmpty(pattern: string, start: number, end: number) {
	for (let i = start; i < end; i++) {
		// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
		const char = pattern[i]!;
		if (char.trim() !== "") {
			return false;
		}
	}

	return true;
}

export default ruleCreator.createRule(typescriptLanguage, {
	about: {
		description:
			"Reports empty alternatives in regular expressions that may indicate a mistake.",
		id: "regexEmptyAlternatives",
		presets: ["logical"],
	},
	messages: {
		emptyAlternative: {
			primary: "Empty alternative in regular expression may be a mistake.",
			secondary: [
				"Empty alternatives match zero characters and are often unintentional.",
				"If intentional, consider using a quantifier like `?` instead.",
			],
			suggestions: ["Remove the empty alternative or use a quantifier."],
		},
	},
	setup(context) {
		function checkRegexLiteral(
			node: AST.RegularExpressionLiteral,
			services: TypeScriptFileServices,
		) {
			const { pattern, start } = getRegExpLiteralDetails(node, services);
			const emptyAlternativeStarts = findEmptyAlternativeStarts(pattern);

			for (const alternativeStart of emptyAlternativeStarts) {
				context.report({
					message: "emptyAlternative",
					range: {
						begin: start + alternativeStart,
						end: start + alternativeStart + 1,
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

			const emptyAlternativeStarts = findEmptyAlternativeStarts(
				construction.pattern,
			);

			for (const alternativeStart of emptyAlternativeStarts) {
				context.report({
					message: "emptyAlternative",
					range: {
						begin: construction.start + 1 + alternativeStart,
						end: construction.start + 1 + alternativeStart + 1,
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
