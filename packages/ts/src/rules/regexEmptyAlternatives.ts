import {
	type AST,
	type TypeScriptFileServices,
	typescriptLanguage,
} from "@flint.fyi/typescript-language";
import * as ts from "typescript";

import { ruleCreator } from "./ruleCreator.ts";

interface EmptyAlternative {
	start: number;
}

function findEmptyAlternatives(pattern: string): EmptyAlternative[] {
	const emptyAlternatives: EmptyAlternative[] = [];

	findEmptyAlternativesInGroup(pattern, 0, pattern.length, emptyAlternatives);

	return emptyAlternatives;
}

function findEmptyAlternativesInGroup(
	pattern: string,
	groupStart: number,
	groupEnd: number,
	results: EmptyAlternative[],
) {
	let charClassDepth = 0;
	let contentStart = groupStart;

	if (
		pattern.slice(groupStart, groupStart + 2) === "?:" ||
		pattern.slice(groupStart, groupStart + 2) === "?=" ||
		pattern.slice(groupStart, groupStart + 2) === "?!" ||
		pattern.slice(groupStart, groupStart + 3) === "?<=" ||
		pattern.slice(groupStart, groupStart + 3) === "?<!"
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
			const parenEnd = findMatchingParen(pattern, i);
			if (parenEnd !== -1) {
				findEmptyAlternativesInGroup(pattern, i + 1, parenEnd, results);
				i = parenEnd;
			}

			continue;
		}

		if (char === "|") {
			pipePositions.push(i);
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
			const lastPipePos = pipePositions[pipePositions.length - 1];
			if (isLast && lastPipePos === undefined) {
				continue;
			}

			const reportPos = isLast ? lastPipePos : start;
			results.push({ start: reportPos });
		}
	}
}

function findMatchingParen(pattern: string, openIndex: number) {
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

function getPatternFromRegex(node: AST.RegularExpressionLiteral) {
	const text = node.text;
	const lastSlash = text.lastIndexOf("/");
	return text.slice(1, lastSlash);
}

function isAlternativeEmpty(pattern: string, start: number, end: number) {
	for (let i = start; i < end; i++) {
		const char = pattern[i];
		if (char !== undefined && char.trim() !== "") {
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
			const pattern = getPatternFromRegex(node);
			const emptyAlternatives = findEmptyAlternatives(pattern);
			const nodeStart = node.getStart(services.sourceFile);

			for (const alt of emptyAlternatives) {
				context.report({
					message: "emptyAlternative",
					range: {
						begin: nodeStart + 1 + alt.start,
						end: nodeStart + 1 + alt.start + 1,
					},
				});
			}
		}

		function checkRegExpConstructor(
			node: AST.CallExpression | AST.NewExpression,
			services: TypeScriptFileServices,
		) {
			if (
				node.expression.kind !== ts.SyntaxKind.Identifier ||
				node.expression.text !== "RegExp"
			) {
				return;
			}

			const args = node.arguments;
			if (!args || args.length === 0) {
				return;
			}

			const patternArg = args[0];
			if (!patternArg || patternArg.kind !== ts.SyntaxKind.StringLiteral) {
				return;
			}

			const rawText = patternArg.getText(services.sourceFile);
			const pattern = rawText.slice(1, -1);
			const emptyAlternatives = findEmptyAlternatives(pattern);
			const nodeStart = patternArg.getStart(services.sourceFile);

			for (const alt of emptyAlternatives) {
				context.report({
					message: "emptyAlternative",
					range: {
						begin: nodeStart + 1 + alt.start,
						end: nodeStart + 1 + alt.start + 1,
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
