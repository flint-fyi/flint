import {
	visitRegExpAST,
	type AST as RegExpAST,
} from "@eslint-community/regexpp";

import {
	typescriptLanguage,
	type AST,
	type TypeScriptFileServices,
} from "@flint.fyi/typescript-language";

import { ruleCreator } from "./ruleCreator.ts";
import { getRegExpConstruction } from "./utils/getRegExpConstruction.ts";
import { getRegExpLiteralDetails } from "./utils/getRegExpLiteralDetails.ts";
import { parseRegexpAst } from "./utils/parseRegexpAst.ts";

function countCapturingGroups(pattern: RegExpAST.Pattern) {
	let count = 0;

	visitRegExpAST(pattern, {
		onCapturingGroupEnter() {
			count++;
		},
	});

	return count;
}

function isOctalEscape(raw: string) {
	return /^\\[0-7]{1,3}$/.test(raw);
}

export default ruleCreator.createRule(typescriptLanguage, {
	about: {
		description: "Reports octal escape sequences in regular expressions.",
		id: "regexOctalEscapes",
		presets: ["logical", "logicalStrict"],
	},
	messages: {
		unexpected: {
			primary:
				"Octal escape sequence '{{ raw }}' can be confused with backreferences.",
			secondary: [
				String.raw`Octal escapes like \1 can be mistaken for backreferences. The same sequence may be a character or a backreference depending on the number of capturing groups.`,
			],
			suggestions: [
				String.raw`Use hexadecimal escape sequences (e.g., \x07) instead of octal escapes.`,
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
					if (charNode.raw === String.raw`\0`) {
						return;
					}

					if (!isOctalEscape(charNode.raw)) {
						return;
					}

					const octalMatch = /^\\([0-7]+)$/.exec(charNode.raw);
					if (octalMatch?.[1]) {
						const octalValue = Number.parseInt(octalMatch[1], 8);
						if (
							octalValue > 0 &&
							octalValue <= capturingGroupCount &&
							!charNode.raw.startsWith(String.raw`\0`)
						) {
							return;
						}
					}

					const shouldReport =
						charNode.raw.startsWith(String.raw`\0`) ||
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
			services: TypeScriptFileServices,
		) {
			const details = getRegExpLiteralDetails(node, services);
			checkPattern(details.pattern, details.start, details.flags);
		}

		function checkRegExpConstructor(
			node: AST.CallExpression | AST.NewExpression,
			services: TypeScriptFileServices,
		) {
			const construction = getRegExpConstruction(node, services);
			if (construction) {
				checkPattern(
					construction.raw,
					construction.start + 1,
					construction.flags,
				);
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
