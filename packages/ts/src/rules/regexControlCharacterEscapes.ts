// flint-disable-file ts/escapeSequenceCasing
import {
	typescriptLanguage,
	type AST,
	type TypeScriptFileServices,
} from "@flint.fyi/typescript-language";

import { ruleCreator } from "./ruleCreator.ts";
import { getRegExpConstruction } from "./utils/getRegExpConstruction.ts";
import { getRegExpLiteralDetails } from "./utils/getRegExpLiteralDetails.ts";

interface ControlCharInfo {
	end: number;
	expected: string;
	found: string;
	start: number;
}

const controlCharacters: Record<string, string> = {
	"\\0": String.raw`\0`,
	"\\cI": String.raw`\t`,
	"\\cJ": String.raw`\n`,
	"\\cK": String.raw`\v`,
	"\\cL": String.raw`\f`,
	"\\cM": String.raw`\r`,
	"\\u000A": String.raw`\n`,
	"\\u000a": String.raw`\n`,
	"\\u000B": String.raw`\v`,
	"\\u000b": String.raw`\v`,
	"\\u000C": String.raw`\f`,
	"\\u000c": String.raw`\f`,
	"\\u000D": String.raw`\r`,
	"\\u000d": String.raw`\r`,
	"\\u0000": String.raw`\0`,
	"\\u0009": String.raw`\t`,
	"\\u{0}": String.raw`\0`,
	"\\u{9}": String.raw`\t`,
	"\\u{a}": String.raw`\n`,
	"\\u{A}": String.raw`\n`,
	"\\u{b}": String.raw`\v`,
	"\\u{B}": String.raw`\v`,
	"\\u{c}": String.raw`\f`,
	"\\u{C}": String.raw`\f`,
	"\\u{d}": String.raw`\r`,
	"\\u{D}": String.raw`\r`,
	"\\x0A": String.raw`\n`,
	"\\x0a": String.raw`\n`,
	"\\x0B": String.raw`\v`,
	"\\x0b": String.raw`\v`,
	"\\x0C": String.raw`\f`,
	"\\x0c": String.raw`\f`,
	"\\x0D": String.raw`\r`,
	"\\x0d": String.raw`\r`,
	"\\x00": String.raw`\0`,
	"\\x09": String.raw`\t`,
};

const controlDoubleEscapePattern =
	/\\\\(?:x0[09A-Da-d]|u000[09A-Da-d]|u\{[09A-Da-d]\}|c[I-M])/g;

const controlSingleEscapePattern =
	/\\(?:x0[09A-Da-d]|u000[09A-Da-d]|u\{[09A-Da-d]\}|c[I-M])/g;

function findControlCharacterIssues(pattern: string, doubleEscaped: boolean) {
	const issues: ControlCharInfo[] = [];
	const searchPattern = doubleEscaped
		? controlDoubleEscapePattern
		: controlSingleEscapePattern;

	let match: null | RegExpExecArray;
	while ((match = searchPattern.exec(pattern)) !== null) {
		const found = match[0];
		const normalizedKey = doubleEscaped ? found.slice(1) : found;
		const expected = controlCharacters[normalizedKey];

		if (expected && normalizedKey !== expected) {
			issues.push({
				end: match.index + found.length,
				expected: doubleEscaped ? "\\" + expected : expected,
				found,
				start: match.index,
			});
		}
	}

	return issues;
}

export default ruleCreator.createRule(typescriptLanguage, {
	about: {
		description:
			"Reports control characters that are not escaped using standard escape sequences.",
		id: "regexControlCharacterEscapes",
		presets: ["logical", "logicalStrict"],
	},
	messages: {
		preferStandardEscape: {
			primary:
				"Prefer standard escape sequence '{{ expected }}' over '{{ found }}'.",
			secondary: [
				String.raw`Standard escape sequences like \t, \n, \r are more readable than hex or unicode escapes.`,
			],
			suggestions: ["Replace '{{ found }}' with '{{ expected }}'."],
		},
	},
	setup(context) {
		function checkRegexLiteral(
			node: AST.RegularExpressionLiteral,
			services: TypeScriptFileServices,
		) {
			const { pattern, start } = getRegExpLiteralDetails(node, services);
			const issues = findControlCharacterIssues(pattern, false);

			for (const issue of issues) {
				context.report({
					data: {
						expected: issue.expected,
						found: issue.found,
					},
					fix: {
						range: {
							begin: start + issue.start,
							end: start + issue.end,
						},
						text: issue.expected,
					},
					message: "preferStandardEscape",
					range: {
						begin: start + issue.start,
						end: start + issue.end,
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

			const issues = findControlCharacterIssues(construction.pattern, true);

			for (const issue of issues) {
				context.report({
					data: {
						expected: issue.expected,
						found: issue.found,
					},
					fix: {
						range: {
							begin: construction.start + 1 + issue.start,
							end: construction.start + 1 + issue.end,
						},
						text: issue.expected,
					},
					message: "preferStandardEscape",
					range: {
						begin: construction.start + 1 + issue.start,
						end: construction.start + 1 + issue.end,
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
