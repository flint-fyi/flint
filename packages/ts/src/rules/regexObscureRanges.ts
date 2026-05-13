import {
	type AST as RegExpAST,
	visitRegExpAST,
} from "@eslint-community/regexpp";
import { typescriptLanguage } from "@flint.fyi/typescript-language";
import type {
	AST,
	TypeScriptFileServices,
} from "@flint.fyi/typescript-language";

import { ruleCreator } from "./ruleCreator.ts";
import { getRegExpConstruction } from "./utils/getRegExpConstruction.ts";
import { getRegExpLiteralDetails } from "./utils/getRegExpLiteralDetails.ts";
import { parseRegexpAst } from "./utils/parseRegexpAst.ts";

const alphanumericRanges: [number, number][] = [
	[0x30, 0x39],
	[0x41, 0x5a],
	[0x61, 0x7a],
];

function formatChar(char: RegExpAST.Character) {
	return char.value >= 0x20 && char.value <= 0x7e
		? String.fromCodePoint(char.value)
		: `U+${char.value.toString(16).toUpperCase().padStart(4, "0")}`;
}

function isControlEscape(raw: string) {
	return /^\\c[A-Za-z]$/.test(raw);
}

function isEscapeSequence(raw: string) {
	return (
		isControlEscape(raw) ||
		isOctalEscape(raw) ||
		isHexLikeEscape(raw) ||
		/^\\[nrtfvbsd]$/i.test(raw)
	);
}

function isHexadecimalEscape(raw: string) {
	return /^\\x[\dA-Fa-f]{2}$/.test(raw);
}

function isHexLikeEscape(raw: string) {
	return isHexadecimalEscape(raw) || isUnicodeEscape(raw);
}

function isInAlphanumericRange(min: number, max: number) {
	for (const [rangeMin, rangeMax] of alphanumericRanges) {
		if (min >= rangeMin && max <= rangeMax) {
			return true;
		}
	}
	return false;
}

function isOctalEscape(raw: string) {
	return /^\\[0-7]{1,3}$/.test(raw);
}

function isUnicodeEscape(raw: string) {
	return /^\\u[\dA-Fa-f]{4}$/.test(raw) || /^\\u\{[\dA-Fa-f]+\}$/.test(raw);
}

export default ruleCreator.createRule(typescriptLanguage, {
	about: {
		description: "Reports obscure character ranges in regular expressions.",
		id: "regexObscureRanges",
		presets: ["logical", "logicalStrict"],
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
			if (!construction) {
				return;
			}

			checkPattern(
				construction.raw,
				construction.start + 1,
				construction.flags,
			);
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
