// flint-disable-file escapeSequenceCasing -- Control character patterns need lowercase escapes
import {
	type AST,
	type TypeScriptFileServices,
	typescriptLanguage,
} from "@flint.fyi/typescript-language";
import * as ts from "typescript";

import { ruleCreator } from "./ruleCreator.ts";

interface ControlCharInfo {
	codePoint: number;
	end: number;
	found: string;
	start: number;
	suggestedEscape?: string | undefined;
}

const KNOWN_CONTROL_ESCAPES: Record<number, string> = {
	0: "\\0",
	9: "\\t",
	10: "\\n",
	11: "\\v",
	12: "\\f",
	13: "\\r",
};

const CONTROL_CHAR_PATTERN =
	/\\x(0[0-9a-fA-F]|1[0-9a-fA-F])|\\u00(0[0-9a-fA-F]|1[0-9a-fA-F])|\\u\{([0-9a-fA-F]|1[0-9a-fA-F])\}|\\c[A-Z]/g;

function findControlCharacters(
	pattern: string,
	doubleEscaped: boolean,
): ControlCharInfo[] {
	const issues: ControlCharInfo[] = [];

	const searchPattern = doubleEscaped
		? /\\\\x(0[0-9A-Fa-f]|1[0-9A-Fa-f])|\\\\u00(0[0-9A-Fa-f]|1[0-9A-Fa-f])|\\\\u\{([0-9A-Fa-f]|1[0-9A-Fa-f])\}|\\\\c[A-Z]/g
		: CONTROL_CHAR_PATTERN;

	let match: null | RegExpExecArray;
	while ((match = searchPattern.exec(pattern)) !== null) {
		const found = match[0];
		const normalizedMatch = doubleEscaped ? found.slice(1) : found;
		const codePoint = parseControlCharCodePoint(normalizedMatch);

		if (codePoint !== undefined && codePoint <= 0x1f) {
			const suggestedEscape = KNOWN_CONTROL_ESCAPES[codePoint];
			issues.push({
				codePoint,
				end: match.index + found.length,
				found,
				start: match.index,
				suggestedEscape: suggestedEscape
					? doubleEscaped
						? "\\" + suggestedEscape
						: suggestedEscape
					: undefined,
			});
		}
	}

	return issues;
}

function formatCodePoint(codePoint: number): string {
	return `U+${codePoint.toString(16).toUpperCase().padStart(4, "0")}`;
}

function getRegexPattern(node: AST.RegularExpressionLiteral): string {
	const text = node.text;
	const lastSlash = text.lastIndexOf("/");
	return text.slice(1, lastSlash);
}

function parseControlCharCodePoint(match: string): number | undefined {
	if (match.startsWith("\\x")) {
		return parseInt(match.slice(2), 16);
	}

	if (match.startsWith("\\u{")) {
		return parseInt(match.slice(3, -1), 16);
	}

	if (match.startsWith("\\u00")) {
		return parseInt(match.slice(4), 16);
	}

	if (match.startsWith("\\c")) {
		const letter = match[2];
		if (letter) {
			return letter.charCodeAt(0) - 64;
		}
	}

	return undefined;
}

export default ruleCreator.createRule(typescriptLanguage, {
	about: {
		description: "Reports control characters in regular expressions.",
		id: "regexControlCharacters",
		presets: ["logical"],
	},
	messages: {
		unexpectedControlChar: {
			primary:
				"Unexpected control character '{{ found }}' ({{ codePoint }}) in regular expression.",
			secondary: [
				"Control characters in regular expressions are rarely intentional and can cause unexpected matching behavior.",
				"If intentional, consider using a more readable escape sequence.",
			],
			suggestions: ["Remove the control character or use a standard escape."],
		},
	},
	setup(context) {
		function checkRegexLiteral(
			node: AST.RegularExpressionLiteral,
			{ sourceFile }: TypeScriptFileServices,
		) {
			const pattern = getRegexPattern(node);
			const issues = findControlCharacters(pattern, false);

			const nodeStart = node.getStart(sourceFile);

			for (const issue of issues) {
				context.report({
					data: {
						codePoint: formatCodePoint(issue.codePoint),
						found: issue.found,
					},
					message: "unexpectedControlChar",
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
			const issues = findControlCharacters(pattern, true);

			const nodeStart = firstArg.getStart(services.sourceFile);

			for (const issue of issues) {
				context.report({
					data: {
						codePoint: formatCodePoint(issue.codePoint),
						found: issue.found,
					},
					message: "unexpectedControlChar",
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
