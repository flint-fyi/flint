import { parseRegExpLiteral, visitRegExpAST } from "@eslint-community/regexpp";
import type { Character, RegExpLiteral } from "@eslint-community/regexpp/ast";
import {
	type AST,
	type TypeScriptFileServices,
	typescriptLanguage,
} from "@flint.fyi/typescript-language";
import * as ts from "typescript";

import { ruleCreator } from "./ruleCreator.ts";

const BACKSPACE_CODE_POINT = 0x08;

interface EscapeBackspace {
	end: number;
	start: number;
}

function findEscapeBackspaces(
	pattern: string,
	flags: string,
): EscapeBackspace[] {
	const results: EscapeBackspace[] = [];

	let ast: RegExpLiteral;
	try {
		ast = parseRegExpLiteral(new RegExp(pattern, flags));
	} catch {
		return results;
	}

	visitRegExpAST(ast, {
		onCharacterEnter(node: Character) {
			if (node.value === BACKSPACE_CODE_POINT && node.raw === "\\b") {
				results.push({
					end: node.end,
					start: node.start,
				});
			}
		},
	});

	return results;
}

function getRegexInfo(node: AST.RegularExpressionLiteral) {
	const text = node.text;
	const lastSlash = text.lastIndexOf("/");
	return {
		flags: text.slice(lastSlash + 1),
		pattern: text.slice(1, lastSlash),
	};
}

export default ruleCreator.createRule(typescriptLanguage, {
	about: {
		description: "Reports escape backspace (`[\\b]`) in character classes.",
		id: "regexEscapeBackspaces",
		presets: ["logical"],
	},
	messages: {
		escapeBackspace: {
			primary: "Use `\\u0008` instead of `[\\b]` for backspace character.",
			secondary: [
				"The `\\b` inside a character class matches the backspace character (U+0008).",
				"Outside a character class, `\\b` is a word boundary assertion.",
				"Using `\\u0008` makes the intent clearer.",
			],
			suggestions: ["Replace `\\b` with `\\u0008`."],
		},
	},
	setup(context) {
		function checkRegexLiteral(
			node: AST.RegularExpressionLiteral,
			services: TypeScriptFileServices,
		) {
			const { flags, pattern } = getRegexInfo(node);
			const backspaces = findEscapeBackspaces(pattern, flags);
			const nodeStart = node.getStart(services.sourceFile);

			for (const backspace of backspaces) {
				context.report({
					message: "escapeBackspace",
					range: {
						begin: nodeStart + backspace.start,
						end: nodeStart + backspace.end,
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
			const pattern = rawText.slice(1, -1).replace(/\\\\/g, "\\");

			let flags = "";
			if (args.length >= 2) {
				const flagsArg = args[1];
				if (flagsArg?.kind === ts.SyntaxKind.StringLiteral) {
					const flagsText = flagsArg.getText(services.sourceFile);
					flags = flagsText.slice(1, -1);
				}
			}

			const backspaces = findEscapeBackspaces(pattern, flags);
			const patternNodeStart = patternArg.getStart(services.sourceFile);

			for (const backspace of backspaces) {
				context.report({
					message: "escapeBackspace",
					range: {
						begin: patternNodeStart + backspace.start,
						end: patternNodeStart + backspace.end,
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
