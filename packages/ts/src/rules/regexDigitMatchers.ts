import {
	type AST,
	type TypeScriptFileServices,
	typescriptLanguage,
} from "@flint.fyi/typescript-language";
import * as ts from "typescript";

import { ruleCreator } from "./ruleCreator.ts";

interface DigitMatcherInfo {
	end: number;
	found: string;
	isNegated: boolean;
	replacement: string;
	start: number;
}

function findDigitMatchers(
	pattern: string,
	doubleEscaped: boolean,
): DigitMatcherInfo[] {
	const issues: DigitMatcherInfo[] = [];

	const digitClassPatterns = doubleEscaped
		? [
				{ isNegated: false, pattern: /\[0-9\]/g, replacement: "\\\\d" },
				{ isNegated: true, pattern: /\[\^0-9\]/g, replacement: "\\\\D" },
				{
					isNegated: false,
					pattern: /\[0123456789\]/g,
					replacement: "\\\\d",
				},
				{
					isNegated: true,
					pattern: /\[\^0123456789\]/g,
					replacement: "\\\\D",
				},
			]
		: [
				{ isNegated: false, pattern: /\[0-9\]/g, replacement: "\\d" },
				{ isNegated: true, pattern: /\[\^0-9\]/g, replacement: "\\D" },
				{ isNegated: false, pattern: /\[0123456789\]/g, replacement: "\\d" },
				{ isNegated: true, pattern: /\[\^0123456789\]/g, replacement: "\\D" },
			];

	for (const {
		isNegated,
		pattern: searchPattern,
		replacement,
	} of digitClassPatterns) {
		let match: null | RegExpExecArray;
		while ((match = searchPattern.exec(pattern)) !== null) {
			issues.push({
				end: match.index + match[0].length,
				found: match[0],
				isNegated,
				replacement,
				start: match.index,
			});
		}
	}

	return issues.sort((a, b) => a.start - b.start);
}

function getRegexPattern(node: AST.RegularExpressionLiteral): string {
	const text = node.text;
	const lastSlash = text.lastIndexOf("/");
	return text.slice(1, lastSlash);
}

export default ruleCreator.createRule(typescriptLanguage, {
	about: {
		description:
			"Reports character classes that match digits and could use \\d or \\D instead.",
		id: "regexDigitMatchers",
		presets: ["stylisticStrict"],
	},
	messages: {
		preferDigitEscape: {
			primary: "Prefer '{{ replacement }}' over character class '{{ found }}'.",
			secondary: [
				"The \\d escape sequence is a more concise and readable way to match digits [0-9].",
				"Similarly, \\D matches any non-digit character.",
			],
			suggestions: ["Replace '{{ found }}' with '{{ replacement }}'."],
		},
	},
	setup(context) {
		function checkRegexLiteral(
			node: AST.RegularExpressionLiteral,
			{ sourceFile }: TypeScriptFileServices,
		) {
			const pattern = getRegexPattern(node);
			const issues = findDigitMatchers(pattern, false);

			const nodeStart = node.getStart(sourceFile);

			for (const issue of issues) {
				context.report({
					data: {
						found: issue.found,
						replacement: issue.replacement,
					},
					fix: {
						range: {
							begin: nodeStart + 1 + issue.start,
							end: nodeStart + 1 + issue.end,
						},
						text: issue.replacement,
					},
					message: "preferDigitEscape",
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
			const issues = findDigitMatchers(pattern, true);

			const nodeStart = firstArg.getStart(services.sourceFile);

			for (const issue of issues) {
				context.report({
					data: {
						found: issue.found,
						replacement: issue.replacement,
					},
					fix: {
						range: {
							begin: nodeStart + 1 + issue.start,
							end: nodeStart + 1 + issue.end,
						},
						text: issue.replacement,
					},
					message: "preferDigitEscape",
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
