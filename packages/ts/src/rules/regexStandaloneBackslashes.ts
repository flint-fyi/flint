import { visitRegExpAST } from "@eslint-community/regexpp";
import type { Character } from "@eslint-community/regexpp/ast";
import {
	getTSNodeRange,
	typescriptLanguage,
} from "@flint.fyi/typescript-language";
import type {
	AST,
	TypeScriptFileServices,
} from "@flint.fyi/typescript-language";

import { ruleCreator } from "./ruleCreator.ts";
import { getRegExpConstruction } from "./utils/getRegExpConstruction.ts";
import { parseRegexpAst } from "./utils/parseRegexpAst.ts";

const CP_BACK_SLASH = 0x5c;

export default ruleCreator.createRule(typescriptLanguage, {
	about: {
		description:
			"Reports standalone backslashes in regex patterns that look like incomplete escape sequences.",
		id: "regexStandaloneBackslashes",
		presets: ["logical"],
	},
	messages: {
		standaloneBackslash: {
			primary:
				"Standalone backslash (`\\`) looks like an incomplete escape sequence.",
			secondary: [
				"This backslash is interpreted as a literal `\\` character because the following character doesn't form a valid escape sequence.",
				"This commonly happens with incomplete control escapes like `\\c` or `\\c1`.",
			],
			suggestions: [
				"Use a valid escape sequence or escape the backslash with `\\\\`.",
			],
		},
	},
	setup(context) {
		function findStandaloneBackslashes(pattern: string, flags: string) {
			const results: Character[] = [];

			const regexpAst = parseRegexpAst(pattern, flags);
			if (!regexpAst) {
				return results;
			}

			visitRegExpAST(regexpAst, {
				onCharacterEnter(charNode) {
					if (charNode.value === CP_BACK_SLASH && charNode.raw === "\\") {
						results.push(charNode);
					}
				},
			});

			return results;
		}

		function checkPattern(
			pattern: string,
			patternStart: number,
			flags: string,
		) {
			const backslashes = findStandaloneBackslashes(pattern, flags);

			for (const backslash of backslashes) {
				context.report({
					message: "standaloneBackslash",
					range: {
						begin: patternStart + backslash.start,
						end: patternStart + backslash.end,
					},
				});
			}
		}

		function checkRegexLiteral(
			node: AST.RegularExpressionLiteral,
			{ sourceFile }: TypeScriptFileServices,
		) {
			const text = node.getText(sourceFile);
			const match = /^\/(.+)\/([dgimsuyv]*)$/.exec(text);
			if (!match) {
				return;
			}

			const [, pattern, flags] = match;
			if (!pattern) {
				return;
			}

			const nodeRange = getTSNodeRange(node, sourceFile);
			checkPattern(pattern, nodeRange.begin + 1, flags ?? "");
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
			checkPattern(patternEscaped, construction.start + 1, construction.flags);
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
