import {
	type AST as RegExpAST,
	visitRegExpAST,
} from "@eslint-community/regexpp";
import { typescriptLanguage } from "@flint.fyi/typescript-language";
import type { AST } from "@flint.fyi/typescript-language";
import * as ts from "typescript";

import { ruleCreator } from "./ruleCreator.ts";
import { parseRegexpAst } from "./utils/parseRegexpAst.ts";

interface CharacterInfo {
	end: number;
	raw: string;
	start: number;
	value: number;
}

function collectSurrogatePairIndices(characters: CharacterInfo[]) {
	const surrogateIndices = new Set<number>();

	for (let index = 0; index < characters.length - 1; index++) {
		const current = characters[index];
		const next = characters[index + 1];

		if (
			current &&
			next &&
			isFourDigitUnicodeEscape(current.raw) &&
			isFourDigitUnicodeEscape(next.raw) &&
			isHighSurrogate(current.value) &&
			isLowSurrogate(next.value) &&
			current.end === next.start
		) {
			surrogateIndices.add(index);
			surrogateIndices.add(index + 1);
		}
	}

	return surrogateIndices;
}

function isFourDigitUnicodeEscape(raw: string) {
	return /^\\u[0-9a-fA-F]{4}$/.test(raw);
}

function isHighSurrogate(codePoint: number) {
	return codePoint >= 0xd800 && codePoint <= 0xdbff;
}

function isLowSurrogate(codePoint: number) {
	return codePoint >= 0xdc00 && codePoint <= 0xdfff;
}

export default ruleCreator.createRule(typescriptLanguage, {
	about: {
		description:
			"Enforces consistent Unicode escape style in regex patterns by preferring codepoint escapes.",
		id: "regexUnicodeEscapes",
		presets: ["stylistic"],
	},
	messages: {
		preferCodepointEscape: {
			primary:
				"Use Unicode codepoint escape '{{ replacement }}' instead of 4-digit escape '{{ raw }}'.",
			secondary: [
				"The \\u{...} format is more flexible, readable, and consistent with modern Unicode handling in JavaScript.",
			],
			suggestions: ["Replace '{{ raw }}' with '{{ replacement }}'."],
		},
	},
	setup(context) {
		function checkPattern(
			pattern: string,
			patternStart: number,
			flags: string,
			canFix: boolean,
		) {
			if (!flags.includes("u") && !flags.includes("v")) {
				return;
			}

			const regexpAst = parseRegexpAst(pattern, flags);
			if (!regexpAst) {
				return;
			}

			const characters: CharacterInfo[] = [];

			visitRegExpAST(regexpAst, {
				onCharacterEnter(charNode: RegExpAST.Character) {
					if (isFourDigitUnicodeEscape(charNode.raw)) {
						characters.push({
							end: charNode.end,
							raw: charNode.raw,
							start: charNode.start,
							value: charNode.value,
						});
					}
				},
			});

			const surrogateIndices = collectSurrogatePairIndices(characters);

			for (let index = 0; index < characters.length; index++) {
				if (surrogateIndices.has(index)) {
					continue;
				}

				const charInfo = characters[index];
				if (!charInfo) {
					continue;
				}

				const hex = charInfo.raw.slice(2);
				const replacement = `\\u{${hex}}`;

				context.report({
					data: {
						raw: charInfo.raw,
						replacement,
					},
					fix: canFix
						? {
								range: {
									begin: patternStart + charInfo.start,
									end: patternStart + charInfo.end,
								},
								text: replacement,
							}
						: undefined,
					message: "preferCodepointEscape",
					range: {
						begin: patternStart + charInfo.start,
						end: patternStart + charInfo.end,
					},
				});
			}
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
			checkPattern(pattern, nodeStart + 1, flags ?? "", true);
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

			checkPattern(firstArgument.text, patternStart, flags, false);
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
