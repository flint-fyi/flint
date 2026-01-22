import { typescriptLanguage } from "@flint.fyi/typescript-language";
import ts from "typescript";

import { ruleCreator } from "./ruleCreator.ts";

interface PatternIssue {
	end: number;
	message: string;
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
				end: match.index + match[0].length,
				message: `Incomplete ${name} sequence.`,
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
			end: match.index + match[0].length,
			message: `Octal escape ${match[0]} is ambiguous; use a hexadecimal escape instead.`,
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
					end: i + 1,
					message: `Unescaped '${char}' should be escaped.`,
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
		const escapedChar = match[1];
		if (!escapedChar) {
			continue;
		}

		if (
			!syntaxChars.test(escapedChar) &&
			!/[dDr-xWSbBnf0-9kpPc]/.test(escapedChar)
		) {
			issues.push({
				end: match.index + match[0].length,
				message: `Useless escape \\${escapedChar}.`,
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
		ambiguousSyntax: {
			primary: "{{issue}}",
			secondary: [
				"This regex uses syntax from ECMAScript Annex B which is ambiguous or deprecated.",
				"Consider using strict regex syntax for clarity and cross-platform compatibility.",
			],
			suggestions: ["Fix the ambiguous regex syntax."],
		},
	},
	setup(context) {
		return {
			visitors: {
				CallExpression: (node, { sourceFile }) => {
					if (
						!ts.isIdentifier(node.expression) ||
						node.expression.text !== "RegExp" ||
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
					const nodeStart = patternArg.getStart(sourceFile);

					for (const issue of issues) {
						context.report({
							data: { issue: issue.message },
							message: "ambiguousSyntax",
							range: {
								begin: nodeStart + 1 + issue.start,
								end: nodeStart + 1 + issue.end,
							},
						});
					}
				},
				NewExpression: (node, { sourceFile }) => {
					if (
						!ts.isIdentifier(node.expression) ||
						node.expression.text !== "RegExp" ||
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
					const nodeStart = patternArg.getStart(sourceFile);

					for (const issue of issues) {
						context.report({
							data: { issue: issue.message },
							message: "ambiguousSyntax",
							range: {
								begin: nodeStart + 1 + issue.start,
								end: nodeStart + 1 + issue.end,
							},
						});
					}
				},
				RegularExpressionLiteral: (node, { sourceFile }) => {
					const text = node.getText(sourceFile);
					const parsed = parseRegexLiteral(text);
					if (!parsed) {
						return;
					}

					const issues = findPatternIssues(parsed.pattern, parsed.flags);
					const nodeStart = node.getStart(sourceFile);

					for (const issue of issues) {
						context.report({
							data: { issue: issue.message },
							message: "ambiguousSyntax",
							range: {
								begin: nodeStart + 1 + issue.start,
								end: nodeStart + 1 + issue.end,
							},
						});
					}
				},
			},
		};
	},
});
