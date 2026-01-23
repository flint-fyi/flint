import {
	type AST as RegExpAST,
	visitRegExpAST,
} from "@eslint-community/regexpp";
import { typescriptLanguage } from "@flint.fyi/typescript-language";
import type { AST } from "@flint.fyi/typescript-language";
import * as ts from "typescript";

import { ruleCreator } from "./ruleCreator.ts";
import { parseRegexpAst } from "./utils/parseRegexpAst.ts";

const ALPHANUMERIC_RANGES: [number, number][] = [
	[0x30, 0x39],
	[0x41, 0x5a],
	[0x61, 0x7a],
];

function formatChar(char: RegExpAST.Character): string {
	if (char.value >= 0x20 && char.value <= 0x7e) {
		return String.fromCodePoint(char.value);
	}
	return `U+${char.value.toString(16).toUpperCase().padStart(4, "0")}`;
}

function isControlEscape(raw: string): boolean {
	return /^\\c[A-Za-z]$/.test(raw);
}

function isEscapeSequence(raw: string): boolean {
	return (
		isControlEscape(raw) ||
		isOctalEscape(raw) ||
		isHexLikeEscape(raw) ||
		/^\\[nrtfvbsd]$/i.test(raw)
	);
}

function isHexadecimalEscape(raw: string): boolean {
	return /^\\x[\dA-Fa-f]{2}$/.test(raw);
}

function isHexLikeEscape(raw: string): boolean {
	return isHexadecimalEscape(raw) || isUnicodeEscape(raw);
}

function isInAlphanumericRange(min: number, max: number): boolean {
	for (const [rangeMin, rangeMax] of ALPHANUMERIC_RANGES) {
		if (min >= rangeMin && max <= rangeMax) {
			return true;
		}
	}
	return false;
}

function isOctalEscape(raw: string): boolean {
	return /^\\[0-7]{1,3}$/.test(raw);
}

function isUnicodeEscape(raw: string): boolean {
	return /^\\u[\dA-Fa-f]{4}$/.test(raw) || /^\\u\{[\dA-Fa-f]+\}$/.test(raw);
}

export default ruleCreator.createRule(typescriptLanguage, {
	about: {
		description: "Reports obscure character ranges in regular expressions.",
		id: "regexObscureRanges",
		presets: ["logical"],
	},
	messages: {
		obscure: {
			primary:
				"Obscure character range '{{ range }}' ({{ minChar }} to {{ maxChar }}) is not obvious.",
			secondary: [
				"Character ranges should be within well-known sets like a-z, A-Z, or 0-9 to avoid confusion.",
			],
			suggestions: [
				"Use explicit character classes or standard ranges instead.",
			],
		},
	},
	setup(context) {
		function checkPattern(
			pattern: string,
			patternStart: number,
			flags: string,
		) {
			const regexpAst = parseRegexpAst(pattern, flags);
			if (!regexpAst) {
				return;
			}

			visitRegExpAST(regexpAst, {
				onCharacterClassRangeEnter(rangeNode) {
					const { max, min } = rangeNode;

					if (min.value === max.value) {
						return;
					}

					if (isControlEscape(min.raw) && isControlEscape(max.raw)) {
						return;
					}

					if (isOctalEscape(min.raw) && isOctalEscape(max.raw)) {
						return;
					}

					if (
						(isHexLikeEscape(min.raw) || min.value === 0) &&
						isHexLikeEscape(max.raw)
					) {
						return;
					}

					if (
						!isEscapeSequence(min.raw) &&
						!isEscapeSequence(max.raw) &&
						isInAlphanumericRange(min.value, max.value)
					) {
						return;
					}

					context.report({
						data: {
							maxChar: formatChar(max),
							minChar: formatChar(min),
							range: rangeNode.raw,
						},
						message: "obscure",
						range: {
							begin: patternStart + rangeNode.start,
							end: patternStart + rangeNode.end,
						},
					});
				},
			});
		}

		function checkRegexLiteral(
			node: AST.RegularExpressionLiteral,
			{ sourceFile }: { sourceFile: ts.SourceFile },
		) {
			const text = node.getText(sourceFile);
			const match = /^\/(.*)\/([dgimsuyv]*)$/.exec(text);

			if (!match) {
				return;
			}

			const [, pattern, flags] = match;

			if (!pattern) {
				return;
			}

			const nodeStart = node.getStart(sourceFile);
			checkPattern(pattern, nodeStart + 1, flags ?? "");
		}

		function checkRegExpConstructor(
			node: AST.CallExpression | AST.NewExpression,
			{ sourceFile }: { sourceFile: ts.SourceFile },
		) {
			if (
				node.expression.kind !== ts.SyntaxKind.Identifier ||
				node.expression.text !== "RegExp"
			) {
				return;
			}

			const args = node.arguments;
			if (!args?.length) {
				return;
			}

			const firstArgument = args[0];

			if (
				!firstArgument ||
				firstArgument.kind !== ts.SyntaxKind.StringLiteral
			) {
				return;
			}

			const patternStart = firstArgument.getStart(sourceFile) + 1;

			let flags = "";
			const secondArgument = args[1];
			if (secondArgument?.kind === ts.SyntaxKind.StringLiteral) {
				flags = secondArgument.text;
			}

			checkPattern(firstArgument.text, patternStart, flags);
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
