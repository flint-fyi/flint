import { visitRegExpAST } from "@eslint-community/regexpp";
import type {
	Character,
	CharacterClassRange,
} from "@eslint-community/regexpp/ast";
import {
	type AST,
	type TypeScriptFileServices,
	typescriptLanguage,
} from "@flint.fyi/typescript-language";

import { ruleCreator } from "./ruleCreator.ts";
import { getRegExpConstruction } from "./utils/getRegExpConstruction.ts";
import { parseRegexpAst } from "./utils/parseRegexpAst.ts";

type EscapeSequenceKind =
	| "control"
	| "hexadecimal"
	| "none"
	| "unicode"
	| "unicodeCodePoint";

interface Issue {
	data: {
		case: string;
		char: string;
	};
	end: number;
	fix?: string;
	message: "unexpectedCase";
	start: number;
}

function checkPattern(pattern: string, flags: string): Issue[] {
	const regexpAst = parseRegexpAst(pattern, flags);
	if (!regexpAst) {
		return [];
	}

	const issues: Issue[] = [];
	const ignoreCase = flags.includes("i");

	function checkCaseInsensitive(charNode: Character) {
		if (charNode.parent.type === "CharacterClassRange") {
			return;
		}

		if (!isLetter(charNode.value)) {
			return;
		}

		if (isLowercaseLetter(charNode.value)) {
			return;
		}

		const lowercase = String.fromCodePoint(charNode.value).toLowerCase();
		issues.push({
			data: {
				case: "lowercase",
				char: charNode.raw,
			},
			end: charNode.end,
			fix: lowercase,
			message: "unexpectedCase",
			start: charNode.start,
		});
	}

	function checkCharacterClassRangeCaseInsensitive(
		rangeNode: CharacterClassRange,
	) {
		if (
			!isLetter(rangeNode.min.value) ||
			!isLetter(rangeNode.max.value) ||
			isLowercaseLetter(rangeNode.min.value) ||
			isLowercaseLetter(rangeNode.max.value)
		) {
			return;
		}

		const lowercaseMin = String.fromCodePoint(rangeNode.min.value);
		const lowercaseMax = String.fromCodePoint(rangeNode.max.value);

		issues.push({
			data: {
				case: "lowercase",
				char: rangeNode.raw,
			},
			end: rangeNode.end,
			fix: `${lowercaseMin}-${lowercaseMax}`.toLowerCase(),
			message: "unexpectedCase",
			start: rangeNode.start,
		});
	}

	function checkUnicodeEscape(charNode: Character) {
		const match = /^(\\u\{?)([\dA-Fa-f]+)(\}?)$/u.exec(charNode.raw);
		if (!match) {
			return;
		}

		const [, prefix, code, suffix] = match;
		if (code === code?.toLowerCase()) {
			return;
		}

		issues.push({
			data: {
				case: "lowercase",
				char: charNode.raw,
			},
			end: charNode.end,
			fix: `${prefix}${code?.toLowerCase()}${suffix}`,
			message: "unexpectedCase",
			start: charNode.start,
		});
	}

	function checkHexadecimalEscape(charNode: Character) {
		const match = /^\\x([\dA-Fa-f]{2})$/u.exec(charNode.raw);
		if (!match) {
			return;
		}

		// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
		const code = match[1]!;

		if (code === code.toLowerCase()) {
			return;
		}

		issues.push({
			data: {
				case: "lowercase",
				char: charNode.raw,
			},
			end: charNode.end,
			fix: `\\x${code.toLowerCase()}`,
			message: "unexpectedCase",
			start: charNode.start,
		});
	}

	function checkControlEscape(charNode: Character) {
		const match = /^\\c([A-Za-z])$/u.exec(charNode.raw);
		if (!match) {
			return;
		}

		// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
		const controlChar = match[1]!;

		if (controlChar === controlChar.toUpperCase()) {
			return;
		}

		issues.push({
			data: {
				case: "uppercase",
				char: charNode.raw,
			},
			end: charNode.end,
			fix: `\\c${controlChar.toUpperCase()}`,
			message: "unexpectedCase",
			start: charNode.start,
		});
	}

	visitRegExpAST(regexpAst, {
		onCharacterClassRangeEnter(rangeNode) {
			if (ignoreCase) {
				checkCharacterClassRangeCaseInsensitive(rangeNode);
			}
		},
		onCharacterEnter(charNode) {
			if (ignoreCase) {
				checkCaseInsensitive(charNode);
			}

			switch (getEscapeSequenceKind(charNode.raw)) {
				case "control": {
					checkControlEscape(charNode);
					break;
				}
				case "hexadecimal": {
					checkHexadecimalEscape(charNode);
					break;
				}

				case "unicode":
				case "unicodeCodePoint": {
					checkUnicodeEscape(charNode);
					break;
				}
			}
		},
	});

	return issues;
}

function getEscapeSequenceKind(raw: string): EscapeSequenceKind {
	if (/^\\u\{[\dA-Fa-f]+\}$/u.test(raw)) {
		return "unicodeCodePoint";
	}

	if (/^\\u[\dA-Fa-f]{4}$/u.test(raw)) {
		return "unicode";
	}

	if (/^\\x[\dA-Fa-f]{2}$/u.test(raw)) {
		return "hexadecimal";
	}

	if (/^\\c[A-Za-z]$/u.test(raw)) {
		return "control";
	}

	return "none";
}

function isLetter(codePoint: number): boolean {
	return /^[a-zA-Z]$/u.test(String.fromCodePoint(codePoint));
}

function isLowercaseLetter(codePoint: number): boolean {
	return /^[a-z]$/u.test(String.fromCodePoint(codePoint));
}

export default ruleCreator.createRule(typescriptLanguage, {
	about: {
		description:
			"Reports inconsistent letter casing in regex escape sequences.",
		id: "regexLetterCasing",
		presets: ["stylisticStrict"],
	},
	messages: {
		unexpectedCase: {
			primary:
				"'{{ char }}' is not in {{ case }} as preferred for consistency.",
			secondary: [
				"Consistent letter casing in escape sequences improves readability.",
			],
			suggestions: ["Convert the escape sequence to {{ case }}."],
		},
	},
	setup(context) {
		function reportIssues(issues: Issue[], patternStart: number) {
			for (const issue of issues) {
				context.report({
					data: issue.data,
					fix: issue.fix
						? {
								range: {
									begin: patternStart + issue.start,
									end: patternStart + issue.end,
								},
								text: issue.fix,
							}
						: undefined,
					message: issue.message,
					range: {
						begin: patternStart + issue.start,
						end: patternStart + issue.end,
					},
				});
			}
		}

		function checkRegexLiteral(
			node: AST.RegularExpressionLiteral,
			{ sourceFile }: TypeScriptFileServices,
		) {
			const text = node.getText(sourceFile);
			const match = /^\/(.+)\/([dgimsuyv]*)$/s.exec(text);
			if (!match) {
				return;
			}

			const [, pattern, flags] = match;
			if (!pattern) {
				return;
			}

			const nodeStart = node.getStart(sourceFile);
			const issues = checkPattern(pattern, flags ?? "");
			reportIssues(issues, nodeStart + 1);
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
			const issues = checkPattern(patternEscaped, construction.flags);
			reportIssues(issues, construction.start + 1);
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
