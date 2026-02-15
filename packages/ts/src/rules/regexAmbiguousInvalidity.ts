import {
	type AST as RegExpAST,
	RegExpParser,
	RegExpValidator,
	visitRegExpAST,
} from "@eslint-community/regexpp";
import type { CharacterClassElement } from "@eslint-community/regexpp/ast";
import {
	type AST,
	isGlobalDeclarationOfName,
	type TypeScriptFileServices,
	typescriptLanguage,
} from "@flint.fyi/typescript-language";
import ts from "typescript";

import { ruleCreator } from "./ruleCreator.ts";

interface PatternIssue {
	data: Record<string, string>;
	end: number;
	message:
		| "incompleteBackreference"
		| "incompleteEscapeSequence"
		| "invalidControlEscape"
		| "invalidPropertyEscape"
		| "invalidRange"
		| "octalEscape"
		| "quantifiedAssertion"
		| "regexMessage"
		| "unescapedSourceCharacter"
		| "uselessEscape";
	start: number;
}

const validator = new RegExpValidator({ ecmaVersion: 2020, strict: true });

const CHARACTER_CLASS_SYNTAX_CHARACTERS = new Set(
	"\\/()[]{}^$.|-+*?".split(""),
);
const SYNTAX_CHARACTERS = new Set("\\/()[]{}^$.|+*?".split(""));

function isControlEscape(raw: string) {
	return /^\\c[A-Za-z]$/u.test(raw);
}

function isEscapeSequence(raw: string) {
	return (
		isOctalEscape(raw) ||
		isControlEscape(raw) ||
		isHexadecimalEscape(raw) ||
		isUnicodeEscape(raw) ||
		isUnicodeCodePointEscape(raw)
	);
}

function isHexadecimalEscape(raw: string) {
	return /^\\x[\dA-Fa-f]{2}$/u.test(raw);
}

function isOctalEscape(raw: string) {
	return /^\\[0-7]{1,3}$/u.test(raw);
}

function isUnicodeCodePointEscape(raw: string) {
	return /^\\u\{[\dA-Fa-f]{1,8}\}$/u.test(raw);
}

function isUnicodeEscape(raw: string) {
	return /^\\u[\dA-Fa-f]{4}$/u.test(raw);
}

function parseFlags(flagsStr: string) {
	return {
		unicode: flagsStr.includes("u"),
		unicodeSets: flagsStr.includes("v"),
	};
}

function validateRegExpPattern(
	pattern: string,
	flags: { unicode: boolean; unicodeSets: boolean },
): null | string {
	try {
		validator.validatePattern(pattern, undefined, undefined, flags);
		return null;
	} catch (error) {
		return error instanceof Error ? error.message : null;
	}
}

// eslint-disable-next-line perfectionist/sort-modules -- checkPatternWithRegexpp calls validateRegExpPattern
function checkPatternWithRegexpp(
	pattern: string,
	flags: { unicode: boolean; unicodeSets: boolean },
) {
	if (flags.unicode || flags.unicodeSets) {
		return [];
	}

	const issues: PatternIssue[] = [];
	const parser = new RegExpParser();

	let ast: RegExpAST.Pattern;
	try {
		ast = parser.parsePattern(pattern, undefined, undefined, flags);
	} catch {
		const message = validateRegExpPattern(pattern, flags);
		if (message) {
			issues.push({
				data: { message },
				end: pattern.length,
				message: "regexMessage",
				start: 0,
			});
		}
		return issues;
	}

	let reported = false;
	let hasNamedBackreference = false;

	visitRegExpAST(ast, {
		onBackreferenceEnter(bNode) {
			if (typeof bNode.ref === "string") {
				hasNamedBackreference = true;
			}
		},
		onCharacterClassEnter(ccNode) {
			for (let i = 0; i < ccNode.elements.length; i++) {
				const current = ccNode.elements[i];

				if (current?.type === "CharacterSet") {
					const next: CharacterClassElement | undefined =
						ccNode.elements[i + 1];
					const nextNext: CharacterClassElement | undefined =
						ccNode.elements[i + 2];

					if (next?.raw === "-" && nextNext) {
						issues.push({
							data: {},
							end: current.end,
							message: "invalidRange",
							start: current.start,
						});
						reported = true;
						return;
					}

					const prev: CharacterClassElement | undefined =
						ccNode.elements[i - 1];
					const prevPrev: CharacterClassElement | undefined =
						ccNode.elements[i - 2];

					if (
						prev?.raw === "-" &&
						prevPrev &&
						prevPrev.type !== "CharacterClassRange"
					) {
						issues.push({
							data: {},
							end: current.end,
							message: "invalidRange",
							start: current.start,
						});
						reported = true;
						return;
					}
				}
			}
		},
		onCharacterEnter(cNode) {
			if (cNode.raw === "\\") {
				issues.push({
					data: {},
					end: cNode.end,
					message: "invalidControlEscape",
					start: cNode.start,
				});
				reported = true;
				return;
			}

			if (cNode.raw === "\\u" || cNode.raw === "\\x") {
				issues.push({
					data: { expr: cNode.raw },
					end: cNode.end,
					message: "incompleteEscapeSequence",
					start: cNode.start,
				});
				reported = true;
				return;
			}

			if (cNode.raw === "\\p" || cNode.raw === "\\P") {
				issues.push({
					data: { expr: cNode.raw },
					end: cNode.end,
					message: "invalidPropertyEscape",
					start: cNode.start,
				});
				reported = true;
				return;
			}

			if (cNode.value !== 0 && isOctalEscape(cNode.raw)) {
				issues.push({
					data: {
						escape: cNode.raw,
						hex: `\\x${cNode.value.toString(16).padStart(2, "0")}`,
					},
					end: cNode.end,
					message: "octalEscape",
					start: cNode.start,
				});
				reported = true;
				return;
			}

			const insideCharClass =
				cNode.parent.type === "CharacterClass" ||
				cNode.parent.type === "CharacterClassRange";

			if (!insideCharClass) {
				if (cNode.raw === "\\k") {
					issues.push({
						data: { expr: cNode.raw },
						end: cNode.end,
						message: "incompleteBackreference",
						start: cNode.start,
					});
					reported = true;
					return;
				}

				if (cNode.raw === "{" || cNode.raw === "}" || cNode.raw === "]") {
					issues.push({
						data: { character: cNode.raw },
						end: cNode.end,
						message: "unescapedSourceCharacter",
						start: cNode.start,
					});
					reported = true;
					return;
				}
			}

			if (isEscapeSequence(cNode.raw)) {
				return;
			}

			if (cNode.raw.startsWith("\\")) {
				const identity = cNode.raw.slice(1);
				const syntaxChars = insideCharClass
					? CHARACTER_CLASS_SYNTAX_CHARACTERS
					: SYNTAX_CHARACTERS;

				if (
					cNode.value === identity.charCodeAt(0) &&
					!syntaxChars.has(identity)
				) {
					issues.push({
						data: { escaped: identity },
						end: cNode.end,
						message: "uselessEscape",
						start: cNode.start,
					});
					reported = true;
				}
			}
		},
		onQuantifierEnter(quantifierNode) {
			if (quantifierNode.element.type === "Assertion") {
				issues.push({
					data: {},
					end: quantifierNode.end,
					message: "quantifiedAssertion",
					start: quantifierNode.start,
				});
				reported = true;
			}
		},
	});

	// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- modified in AST visitor callbacks
	if (hasNamedBackreference) {
		return issues;
	}

	// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- modified in AST visitor callbacks
	if (!reported) {
		const message = validateRegExpPattern(pattern, flags);
		if (message) {
			issues.push({
				data: { message },
				end: pattern.length,
				message: "regexMessage",
				start: 0,
			});
		}
	}

	return issues;
}

export default ruleCreator.createRule(typescriptLanguage, {
	about: {
		description:
			"Reports regex patterns that use ambiguous or invalid syntax from Annex B.",
		id: "regexAmbiguousInvalidity",
		presets: ["logical", "logicalStrict"],
	},
	messages: {
		incompleteBackreference: {
			primary: "Incomplete backreference '{{ expr }}'.",
			secondary: [
				"This regex uses syntax from ECMAScript Annex B which is ambiguous or deprecated.",
				"Either use a valid backreference or remove the useless escaping.",
			],
			suggestions: ["Complete the backreference or remove the escape."],
		},
		incompleteEscapeSequence: {
			primary: "Incomplete escape sequence '{{ expr }}'.",
			secondary: [
				"This regex uses syntax from ECMAScript Annex B which is ambiguous or deprecated.",
				"Either use a valid escape sequence or remove the useless escaping.",
			],
			suggestions: ["Complete the escape sequence or remove the escape."],
		},
		invalidControlEscape: {
			primary: "Invalid or incomplete control escape sequence.",
			secondary: [
				"This regex uses syntax from ECMAScript Annex B which is ambiguous or deprecated.",
				"Either use a valid control escape sequence or escape the standalone backslash.",
			],
			suggestions: [
				"Use a valid control escape like \\cA or escape the backslash.",
			],
		},
		invalidPropertyEscape: {
			primary: "Invalid property escape sequence '{{ expr }}'.",
			secondary: [
				"This regex uses syntax from ECMAScript Annex B which is ambiguous or deprecated.",
				"Either use a valid property escape sequence or remove the useless escaping.",
			],
			suggestions: [
				"Use a valid Unicode property escape like \\p{L} with the 'u' flag.",
			],
		},
		invalidRange: {
			primary:
				"Invalid character class range. A character set cannot be the minimum or maximum of a character class range.",
			secondary: [
				"This regex uses syntax from ECMAScript Annex B which is ambiguous or deprecated.",
				"Either escape the `-` or fix the character class range.",
			],
			suggestions: ["Escape the `-` character or reorder the character class."],
		},
		octalEscape: {
			primary:
				"Invalid legacy octal escape sequence '{{ escape }}'. Use a hexadecimal escape instead.",
			secondary: [
				"This regex uses syntax from ECMAScript Annex B which is ambiguous or deprecated.",
				"Octal escapes can be confused with backreferences.",
			],
			suggestions: ["Replace with hexadecimal escape '{{ hex }}'."],
		},
		quantifiedAssertion: {
			primary: "Assertions are not allowed to be quantified directly.",
			secondary: [
				"This regex uses syntax from ECMAScript Annex B which is ambiguous or deprecated.",
				"Wrap the assertion in a non-capturing group if you need to quantify it.",
			],
			suggestions: ["Wrap the assertion in a non-capturing group: (?:...)"],
		},
		regexMessage: {
			primary: "{{ message }}.",
			secondary: [
				"This regex uses syntax from ECMAScript Annex B which is ambiguous or deprecated.",
				"Consider using strict regex syntax for clarity and cross-platform compatibility.",
			],
			suggestions: ["Fix the regex syntax error."],
		},
		unescapedSourceCharacter: {
			primary:
				"Unescaped source character '{{ character }}' should be escaped.",
			secondary: [
				"This regex uses syntax from ECMAScript Annex B which is ambiguous or deprecated.",
				"Consider using strict regex syntax for clarity and cross-platform compatibility.",
			],
			suggestions: ["Escape the character with a backslash."],
		},
		uselessEscape: {
			primary: "Useless escape '\\{{ escaped }}'.",
			secondary: [
				"This regex uses syntax from ECMAScript Annex B which is ambiguous or deprecated.",
				"Identity escapes with non-syntax characters are forbidden in strict mode.",
			],
			suggestions: ["Remove the unnecessary backslash."],
		},
	},
	setup(context) {
		function reportIssues(issues: PatternIssue[], start: number) {
			for (const issue of issues) {
				context.report({
					data: issue.data,
					message: issue.message,
					range: {
						begin: start + issue.start + 1,
						end: start + issue.end + 1,
					},
				});
			}
		}

		function checkCallOrNewExpression(
			node: AST.CallExpression | AST.NewExpression,
			{ sourceFile, typeChecker }: TypeScriptFileServices,
		) {
			if (
				!ts.isIdentifier(node.expression) ||
				node.expression.text !== "RegExp" ||
				!isGlobalDeclarationOfName(node.expression, "RegExp", typeChecker) ||
				!node.arguments?.length
			) {
				return;
			}

			// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
			const patternArg = node.arguments[0]!;

			if (!ts.isStringLiteral(patternArg)) {
				return;
			}

			const flagsArg = node.arguments[1];
			const flagsText =
				flagsArg && ts.isStringLiteral(flagsArg) ? flagsArg.text : "";
			const flags = parseFlags(flagsText);
			const issues = checkPatternWithRegexpp(patternArg.text, flags);

			reportIssues(issues, patternArg.getStart(sourceFile));
		}

		return {
			visitors: {
				CallExpression: checkCallOrNewExpression,
				NewExpression: checkCallOrNewExpression,
				RegularExpressionLiteral: (node, { sourceFile }) => {
					const text = node.getText(sourceFile);
					const lastSlash = text.lastIndexOf("/");
					if (lastSlash <= 0) {
						return undefined;
					}

					const flagsText = text.slice(lastSlash + 1);
					const flags = parseFlags(flagsText);
					const issues = checkPatternWithRegexpp(
						text.slice(1, lastSlash),
						flags,
					);

					reportIssues(issues, node.getStart(sourceFile));
				},
			},
		};
	},
});
