import type { ReportInterpolationData } from "@flint.fyi/core";
import {
	isGlobalDeclarationOfName,
	typescriptLanguage,
} from "@flint.fyi/typescript-language";
import ts from "typescript";

import { ruleCreator } from "./ruleCreator.ts";

interface PatternIssue {
	data: ReportInterpolationData;
	end: number;
	message:
		| "ambiguousOctalEscape"
		| "incompleteNameSequence"
		| "unescapedCharacter"
		| "uselessEscape";
	start: number;
}

function checkIncompleteEscape(pattern: string): PatternIssue[] {
	const issues: PatternIssue[] = [];

	const incompletePatterns = [
		{ name: "\\x escape", pattern: /\\x(?![0-9a-fA-F]{2})/g },
		{
			name: "\\u escape",
			pattern: /\\u(?![0-9a-fA-F]{4})(?!\{[0-9a-fA-F]+\})/g,
		},
		{ name: "\\c escape", pattern: /\\c(?![A-Za-z])/g },
	];

	for (const { name, pattern: regex } of incompletePatterns) {
		let match: null | RegExpExecArray;
		while ((match = regex.exec(pattern)) !== null) {
			issues.push({
				data: { name },
				end: match.index + match[0].length,
				message: "incompleteNameSequence",
				start: match.index,
			});
		}
	}

	return issues;
}

function checkOctalEscape(pattern: string): PatternIssue[] {
	const issues: PatternIssue[] = [];
	const octalRegex = /\\(?:[1-7][0-7]*|0[0-7]+)/g;
	let match: null | RegExpExecArray;
	while ((match = octalRegex.exec(pattern)) !== null) {
		issues.push({
			data: { escape: match[0] },
			end: match.index + match[0].length,
			message: "ambiguousOctalEscape",
			start: match.index,
		});
	}
	return issues;
}

function checkUnescapedBrackets(pattern: string): PatternIssue[] {
	const issues: PatternIssue[] = [];
	let inCharClass = false;
	let i = 0;

	while (i < pattern.length) {
		const char = pattern[i];

		if (char === "\\") {
			i += 2;
			continue;
		}

		if (char === "[" && !inCharClass) {
			inCharClass = true;
			i++;
			continue;
		}

		if (char === "]" && inCharClass) {
			inCharClass = false;
			i++;
			continue;
		}

		if (!inCharClass) {
			if (char === "]" || char === "{" || char === "}") {
				issues.push({
					data: { character: char },
					end: i + 1,
					message: "unescapedCharacter",
					start: i,
				});
			}
		}

		i++;
	}

	return issues;
}

function checkUselessEscape(
	pattern: string,
	insideCharClass: boolean,
): PatternIssue[] {
	const issues: PatternIssue[] = [];
	const syntaxChars = insideCharClass
		? /[\\[\]^$.\-|*+?(){}]/
		: /[\\[\]^$.|*+?(){}]/;

	const escapeRegex = /\\(.)/g;
	let match: null | RegExpExecArray;
	while ((match = escapeRegex.exec(pattern)) !== null) {
		const escaped = match[1];
		if (!escaped) {
			continue;
		}

		if (!syntaxChars.test(escaped) && !/[dDr-xWSbBnf0-9kpPc]/.test(escaped)) {
			issues.push({
				data: { escaped },
				end: match.index + match[0].length,
				message: "uselessEscape",
				start: match.index,
			});
		}
	}
	return issues;
}

function findPatternIssues(pattern: string, flags: string): PatternIssue[] {
	if (flags.includes("u") || flags.includes("v")) {
		return [];
	}

	return [
		...checkOctalEscape(pattern),
		...checkIncompleteEscape(pattern),
		...checkUnescapedBrackets(pattern),
		...checkUselessEscape(pattern, false),
	];
}

function parseRegexLiteral(text: string) {
	const lastSlash = text.lastIndexOf("/");
	if (lastSlash <= 0) {
		return undefined;
	}
	return {
		flags: text.slice(lastSlash + 1),
		pattern: text.slice(1, lastSlash),
	};
}

export default ruleCreator.createRule(typescriptLanguage, {
	about: {
		description:
			"Reports regex patterns that use ambiguous or invalid syntax from Annex B.",
		id: "regexAmbiguousInvalidity",
		presets: ["logical"],
	},
	messages: {
		ambiguousOctalEscape: {
			primary:
				"Octal escape `{{ escape }}` is ambiguous; use a hexadecimal escape instead.",
			secondary: [
				"This regex uses syntax from ECMAScript Annex B which is ambiguous or deprecated.",
				"Consider using strict regex syntax for clarity and cross-platform compatibility.",
			],
			suggestions: ["Switch to a hexadecimal escape instead."],
		},
		incompleteNameSequence: {
			primary: "Incomplete {{ name }} sequence.",
			secondary: [
				"This regex uses syntax from ECMAScript Annex B which is ambiguous or deprecated.",
				"Consider using strict regex syntax for clarity and cross-platform compatibility.",
			],
			suggestions: ["Complete the name sequence."],
		},
		unescapedCharacter: {
			primary: "Unescaped character `{{ character }}` should be escaped.",
			secondary: [
				"This regex uses syntax from ECMAScript Annex B which is ambiguous or deprecated.",
				"Consider using strict regex syntax for clarity and cross-platform compatibility.",
			],
			suggestions: ["Escape the character."],
		},
		uselessEscape: {
			primary: "Useless escape `\\{{ escaped }}`.",
			secondary: [
				"This regex uses syntax from ECMAScript Annex B which is ambiguous or deprecated.",
				"Consider using strict regex syntax for clarity and cross-platform compatibility.",
			],
			suggestions: ["Remove the useless escape."],
		},
	},
	setup(context) {
		function reportIssues(issues: PatternIssue[], start: number) {
			for (const issue of issues) {
				context.report({
					data: issue.data,
					message: issue.message,
					range: {
						begin: start + 1 + issue.start,
						end: start + 1 + issue.end,
					},
				});
			}
		}

		return {
			visitors: {
				CallExpression: (node, { sourceFile, typeChecker }) => {
					if (
						!ts.isIdentifier(node.expression) ||
						node.expression.text !== "RegExp" ||
						!isGlobalDeclarationOfName(
							node.expression,
							"RegExp",
							typeChecker,
						) ||
						!node.arguments.length
					) {
						return;
					}

					const patternArg = node.arguments[0];
					if (!patternArg || !ts.isStringLiteral(patternArg)) {
						return;
					}

					const flagsArg = node.arguments[1];
					const flags =
						flagsArg && ts.isStringLiteral(flagsArg) ? flagsArg.text : "";

					const issues = findPatternIssues(patternArg.text, flags);

					reportIssues(issues, patternArg.getStart(sourceFile));
				},
				NewExpression: (node, { sourceFile, typeChecker }) => {
					if (
						!ts.isIdentifier(node.expression) ||
						node.expression.text !== "RegExp" ||
						!isGlobalDeclarationOfName(
							node.expression,
							"RegExp",
							typeChecker,
						) ||
						!node.arguments?.length
					) {
						return;
					}

					const patternArg = node.arguments[0];
					if (!patternArg || !ts.isStringLiteral(patternArg)) {
						return;
					}

					const flagsArg = node.arguments[1];
					const flags =
						flagsArg && ts.isStringLiteral(flagsArg) ? flagsArg.text : "";

					const issues = findPatternIssues(patternArg.text, flags);

					reportIssues(issues, patternArg.getStart(sourceFile));
				},
				RegularExpressionLiteral: (node, { sourceFile }) => {
					const text = node.getText(sourceFile);
					const parsed = parseRegexLiteral(text);
					if (!parsed) {
						return;
					}

					const issues = findPatternIssues(parsed.pattern, parsed.flags);

					reportIssues(issues, node.getStart(sourceFile));
				},
			},
		};
	},
});
