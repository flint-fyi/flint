import {
	type AST as RegExpAST,
	visitRegExpAST,
} from "@eslint-community/regexpp";
import {
	getTSNodeRange,
	typescriptLanguage,
} from "@flint.fyi/typescript-language";

import { ruleCreator } from "./ruleCreator.ts";
import { parseRegexpAst } from "./utils/parseRegexpAst.ts";

type EscapeType = "control" | "hexadecimal" | "literal" | "octal" | "unicode";

function getEscapeType(raw: string): EscapeType | undefined {
	if (raw.length === 1) {
		return "literal";
	}

	if (!raw.startsWith("\\")) {
		return undefined;
	}

	const second = raw[1];

	if (second === "x") {
		return "hexadecimal";
	}

	if (second === "u") {
		return "unicode";
	}

	if (second === "c") {
		return "control";
	}

	if (second !== undefined && second >= "0" && second <= "7") {
		return "octal";
	}

	return undefined;
}

function toHexEscape(codePoint: number) {
	return `\\x${codePoint.toString(16).padStart(2, "0")}`;
}

export default ruleCreator.createRule(typescriptLanguage, {
	about: {
		description:
			"Reports regex character escapes that can be expressed more consistently using hexadecimal escapes.",
		id: "regexHexadecimalEscapes",
		presets: ["stylisticStrict"],
	},
	messages: {
		preferHexEscape: {
			primary:
				"Prefer the more succinct hexadecimal escape `{{ hexEscape }}` over {{ escapeType }} escape `{{ found }}`.",
			secondary: [
				"Hexadecimal escapes are more concise for characters in the 0x00-0xFF range.",
			],
			suggestions: ["Replace `{{ found }}` with `{{ hexEscape }}`."],
		},
	},
	setup(context) {
		return {
			visitors: {
				RegularExpressionLiteral: (node, { sourceFile }) => {
					const match = /^\/(.+)\/([dgimsuyv]*)$/.exec(node.text);
					if (!match) {
						return;
					}

					const [, pattern, flagsStr] = match;
					if (!pattern) {
						return;
					}

					const regexpAst = parseRegexpAst(pattern, flagsStr);
					if (!regexpAst) {
						return;
					}

					const range = getTSNodeRange(node, sourceFile);

					visitRegExpAST(regexpAst, {
						onCharacterEnter(charNode: RegExpAST.Character) {
							if (charNode.value > 0xff) {
								return;
							}

							const escapeType = getEscapeType(charNode.raw);
							if (!escapeType) {
								return;
							}

							if (
								escapeType === "unicode" &&
								(charNode.raw.startsWith("\\u00") ||
									(charNode.raw.startsWith("\\u{") && charNode.value <= 0xff))
							) {
								const hexEscape = toHexEscape(charNode.value);

								context.report({
									data: {
										escapeType,
										found: charNode.raw,
										hexEscape,
									},
									fix: {
										range: {
											begin: range.begin + 1 + charNode.start,
											end: range.begin + 1 + charNode.end,
										},
										text: hexEscape,
									},
									message: "preferHexEscape",
									range: {
										begin: range.begin + 1 + charNode.start,
										end: range.begin + 1 + charNode.end,
									},
								});
							}
						},
					});
				},
			},
		};
	},
});
