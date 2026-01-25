import { parseRegExpLiteral, visitRegExpAST } from "@eslint-community/regexpp";
import type { Character, RegExpLiteral } from "@eslint-community/regexpp/ast";
import {
	type AST,
	type TypeScriptFileServices,
	typescriptLanguage,
} from "@flint.fyi/typescript-language";

import { ruleCreator } from "./ruleCreator.ts";
import { getRegExpConstruction } from "./utils/getRegExpConstruction.ts";
import { getRegExpLiteralDetails } from "./utils/getRegExpLiteralDetails.ts";

function findEscapeBackspaces(pattern: string, flags: string) {
	const results: Character[] = [];

	let ast: RegExpLiteral;
	try {
		ast = parseRegExpLiteral(new RegExp(pattern, flags));
	} catch {
		return results;
	}

	visitRegExpAST(ast, {
		onCharacterEnter(node: Character) {
			if (node.raw === "\\b") {
				results.push(node);
			}
		},
	});

	return results;
}

export default ruleCreator.createRule(typescriptLanguage, {
	about: {
		description: "Reports escape backspace (`[\\b]`) in character classes.",
		id: "regexEscapeBackspaces",
		presets: ["stylistic"],
	},
	messages: {
		escapeBackspace: {
			primary:
				"Prefer the clearer `\\u0008` instead of `[\\b]` for backspace character.",
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
			const { flags, pattern, start } = getRegExpLiteralDetails(node, services);
			const backspaces = findEscapeBackspaces(pattern, flags);

			for (const backspace of backspaces) {
				context.report({
					message: "escapeBackspace",
					range: {
						begin: start + backspace.start - 1,
						end: start + backspace.end - 1,
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

			const patternEscaped = construction.pattern.replace(/\\\\/g, "\\");
			const backspaces = findEscapeBackspaces(
				patternEscaped,
				construction.flags,
			);

			for (const backspace of backspaces) {
				context.report({
					message: "escapeBackspace",
					range: {
						begin: construction.start + backspace.start,
						end: construction.start + backspace.end,
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
