// flint-disable-file escapeSequenceCasing -- Lowercase escapes are intentional in this rule
import {
	type AST,
	type TypeScriptFileServices,
	typescriptLanguage,
} from "@flint.fyi/typescript-language";
import * as ts from "typescript";

import { ruleCreator } from "./ruleCreator.ts";

interface ControlCharInfo {
	end: number;
	expected: string;
	found: string;
	start: number;
}

const CONTROL_CHAR_MAP: Record<string, string> = {
	"\\0": "\\0",
	"\\cI": "\\t",
	"\\cJ": "\\n",
	"\\cK": "\\v",
	"\\cL": "\\f",
	"\\cM": "\\r",
	"\\u000A": "\\n",
	"\\u000a": "\\n",
	"\\u000B": "\\v",
	"\\u000b": "\\v",
	"\\u000C": "\\f",
	"\\u000c": "\\f",
	"\\u000D": "\\r",
	"\\u000d": "\\r",
	"\\u0000": "\\0",
	"\\u0009": "\\t",
	"\\u{0}": "\\0",
	"\\u{9}": "\\t",
	"\\u{a}": "\\n",
	"\\u{A}": "\\n",
	"\\u{b}": "\\v",
	"\\u{B}": "\\v",
	"\\u{c}": "\\f",
	"\\u{C}": "\\f",
	"\\u{d}": "\\r",
	"\\u{D}": "\\r",
	"\\x0A": "\\n",
	"\\x0a": "\\n",
	"\\x0B": "\\v",
	"\\x0b": "\\v",
	"\\x0C": "\\f",
	"\\x0c": "\\f",
	"\\x0D": "\\r",
	"\\x0d": "\\r",
	"\\x00": "\\0",
	"\\x09": "\\t",
};

const CONTROL_ESCAPE_PATTERN =
	/\\(?:x0[09A-Da-d]|u000[09A-Da-d]|u\{[09A-Da-d]\}|c[I-M])/g;

function findControlCharacterIssues(
	pattern: string,
	doubleEscaped: boolean,
): ControlCharInfo[] {
	const issues: ControlCharInfo[] = [];
	const searchPattern = doubleEscaped
		? /\\\\(?:x0[09A-Da-d]|u000[09A-Da-d]|u\{[09A-Da-d]\}|c[I-M])/g
		: CONTROL_ESCAPE_PATTERN;

	let match: null | RegExpExecArray;
	while ((match = searchPattern.exec(pattern)) !== null) {
		const found = match[0];
		const normalizedKey = doubleEscaped ? found.slice(1) : found;
		const expected = CONTROL_CHAR_MAP[normalizedKey];

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

function getRegexPattern(node: AST.RegularExpressionLiteral): string {
	const text = node.text;
	const lastSlash = text.lastIndexOf("/");
	return text.slice(1, lastSlash);
}

export default ruleCreator.createRule(typescriptLanguage, {
	about: {
		description:
			"Reports control characters that are not escaped using standard escape sequences.",
		id: "regexControlCharacterEscapes",
		presets: ["logical"],
	},
	messages: {
		preferStandardEscape: {
			primary:
				"Prefer standard escape sequence '{{ expected }}' over '{{ found }}'.",
			secondary: [
				"Standard escape sequences like \\t, \\n, \\r are more readable than hex or unicode escapes.",
			],
			suggestions: ["Replace '{{ found }}' with '{{ expected }}'."],
		},
	},
	setup(context) {
		function checkRegexLiteral(
			node: AST.RegularExpressionLiteral,
			{ sourceFile }: TypeScriptFileServices,
		) {
			const pattern = getRegexPattern(node);
			const issues = findControlCharacterIssues(pattern, false);

			const nodeStart = node.getStart(sourceFile);

			for (const issue of issues) {
				context.report({
					data: {
						expected: issue.expected,
						found: issue.found,
					},
					fix: {
						range: {
							begin: nodeStart + 1 + issue.start,
							end: nodeStart + 1 + issue.end,
						},
						text: issue.expected,
					},
					message: "preferStandardEscape",
					range: {
						begin: nodeStart + 1 + issue.start,
						end: nodeStart + 1 + issue.end,
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

			const firstArg = args[0];
			if (!firstArg || firstArg.kind !== ts.SyntaxKind.StringLiteral) {
				return;
			}

			const stringLiteral = firstArg;
			const rawText = stringLiteral.getText(services.sourceFile);
			const pattern = rawText.slice(1, -1);
			const issues = findControlCharacterIssues(pattern, true);

			const nodeStart = firstArg.getStart(services.sourceFile);

			for (const issue of issues) {
				context.report({
					data: {
						expected: issue.expected,
						found: issue.found,
					},
					fix: {
						range: {
							begin: nodeStart + 1 + issue.start,
							end: nodeStart + 1 + issue.end,
						},
						text: issue.expected,
					},
					message: "preferStandardEscape",
					range: {
						begin: nodeStart + 1 + issue.start,
						end: nodeStart + 1 + issue.end,
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
