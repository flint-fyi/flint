import {
	type AST as RegExpAST,
	visitRegExpAST,
} from "@eslint-community/regexpp";
import { typescriptLanguage } from "@flint.fyi/typescript-language";
import type { AST } from "@flint.fyi/typescript-language";
import * as ts from "typescript";

import { ruleCreator } from "./ruleCreator.ts";
import { parseRegexpAst } from "./utils/parseRegexpAst.ts";

function countCapturingGroups(pattern: RegExpAST.Pattern): number {
	let count = 0;
	visitRegExpAST(pattern, {
		onCapturingGroupEnter() {
			count++;
		},
	});
	return count;
}

function isOctalEscape(raw: string): boolean {
	return /^\\[0-7]{1,3}$/.test(raw);
}

export default ruleCreator.createRule(typescriptLanguage, {
	about: {
		description: "Reports octal escape sequences in regular expressions.",
		id: "regexOctalEscapes",
		presets: ["logical"],
	},
	messages: {
		unexpected: {
			primary:
				"Octal escape sequence '{{ raw }}' can be confused with backreferences.",
			secondary: [
				"Octal escapes like \\1 can be mistaken for backreferences. The same sequence may be a character or a backreference depending on the number of capturing groups.",
			],
			suggestions: [
				"Use hexadecimal escape sequences (e.g., \\x07) instead of octal escapes.",
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

			const capturingGroupCount = countCapturingGroups(regexpAst);

			visitRegExpAST(regexpAst, {
				onCharacterEnter(charNode) {
					if (charNode.raw === "\\0") {
						return;
					}

					if (!isOctalEscape(charNode.raw)) {
						return;
					}

					const octalMatch = /^\\([0-7]+)$/.exec(charNode.raw);
					if (octalMatch?.[1]) {
						const octalValue = parseInt(octalMatch[1], 8);
						if (
							octalValue > 0 &&
							octalValue <= capturingGroupCount &&
							!charNode.raw.startsWith("\\0")
						) {
							return;
						}
					}

					const shouldReport =
						charNode.raw.startsWith("\\0") ||
						!(
							charNode.parent.type === "CharacterClass" ||
							charNode.parent.type === "CharacterClassRange"
						);

					if (shouldReport) {
						context.report({
							data: {
								raw: charNode.raw,
							},
							message: "unexpected",
							range: {
								begin: patternStart + charNode.start,
								end: patternStart + charNode.end,
							},
						});
					}
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
