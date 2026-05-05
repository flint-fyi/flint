import {
	type AST as RegExpAST,
	visitRegExpAST,
} from "@eslint-community/regexpp";
import {
	type AST,
	type TypeScriptFileServices,
	typescriptLanguage,
} from "@flint.fyi/typescript-language";

import { ruleCreator } from "./ruleCreator.ts";
import { getRegExpConstruction } from "./utils/getRegExpConstruction.ts";
import { getRegExpLiteralDetails } from "./utils/getRegExpLiteralDetails.ts";
import { parseRegexpAst } from "./utils/parseRegexpAst.ts";

interface Issue {
	end: number;
	negated: boolean;
	raw: string;
	start: number;
}

function findIssues(pattern: string, flags: string): Issue[] {
	const issues: Issue[] = [];
	const hasIgnoreCase = flags.includes("i");

	const ast = parseRegexpAst(pattern, flags);
	if (!ast) {
		return issues;
	}

	visitRegExpAST(ast, {
		onCharacterClassEnter(characterClassNode) {
			const expectedCount = hasIgnoreCase ? 3 : 4;

			if (characterClassNode.elements.length !== expectedCount) {
				return;
			}

			let hasDigit = false;
			let hasLower = false;
			let hasUpper = false;
			let hasUnderscore = false;

			for (const element of characterClassNode.elements) {
				if (isDigitRange(element)) {
					if (hasDigit) {
						return;
					}
					hasDigit = true;
				} else if (isLowerRange(element)) {
					if (hasLower) {
						return;
					}
					hasLower = true;
				} else if (isUpperRange(element)) {
					if (hasUpper) {
						return;
					}
					hasUpper = true;
				} else if (isUnderscore(element)) {
					if (hasUnderscore) {
						return;
					}
					hasUnderscore = true;
				} else {
					return;
				}
			}

			const hasAllRequired = hasIgnoreCase
				? hasDigit && hasLower && hasUnderscore && !hasUpper
				: hasDigit && hasLower && hasUpper && hasUnderscore;

			if (!hasAllRequired) {
				return;
			}

			issues.push({
				end: characterClassNode.end,
				negated: characterClassNode.negate,
				raw: characterClassNode.raw,
				start: characterClassNode.start,
			});
		},
	});

	return issues;
}

function isDigitRange(element: RegExpAST.CharacterClassElement) {
	if (element.type === "CharacterSet" && element.kind === "digit") {
		return true;
	}
	if (element.type === "CharacterClassRange") {
		return element.min.value === 0x30 && element.max.value === 0x39;
	}
	return false;
}

function isLowerRange(element: RegExpAST.CharacterClassElement) {
	if (element.type === "CharacterClassRange") {
		return element.min.value === 0x61 && element.max.value === 0x7a;
	}
	return false;
}

function isUnderscore(element: RegExpAST.CharacterClassElement) {
	if (element.type === "Character") {
		return element.value === 0x5f;
	}
	return false;
}

function isUpperRange(element: RegExpAST.CharacterClassElement) {
	if (element.type === "CharacterClassRange") {
		return element.min.value === 0x41 && element.max.value === 0x5a;
	}
	return false;
}

export default ruleCreator.createRule(typescriptLanguage, {
	about: {
		description:
			"Reports character classes that match word characters and could use \\w or \\W instead.",
		id: "regexWordMatchers",
		presets: ["stylisticStrict"],
	},
	messages: {
		preferWord: {
			primary:
				"Character class '{{ raw }}' can be replaced with '{{ replacement }}'.",
			secondary: ["The \\w shorthand matches [a-zA-Z0-9_] (word characters)."],
			suggestions: ["Replace with '{{ replacement }}'."],
		},
	},
	setup(context) {
		function checkRegexLiteral(
			node: AST.RegularExpressionLiteral,
			services: TypeScriptFileServices,
		) {
			const { flags, pattern, start } = getRegExpLiteralDetails(node, services);
			const issues = findIssues(pattern, flags);

			for (const issue of issues) {
				const replacement = issue.negated ? "\\W" : "\\w";
				context.report({
					data: {
						raw: issue.raw,
						replacement,
					},
					fix: {
						range: {
							begin: start + issue.start,
							end: start + issue.end,
						},
						text: replacement,
					},
					message: "preferWord",
					range: {
						begin: start + issue.start,
						end: start + issue.end,
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

			const { flags, pattern, start } = construction;
			const unescapedPattern = pattern.replace(/\\\\/g, "\\");
			const issues = findIssues(unescapedPattern, flags);

			function mapPositionToSource(pos: number) {
				let sourcePos = 0;
				let patternPos = 0;
				while (patternPos < pos && sourcePos < pattern.length) {
					if (pattern[sourcePos] === "\\" && pattern[sourcePos + 1] === "\\") {
						sourcePos += 2;
					} else {
						sourcePos += 1;
					}
					patternPos += 1;
				}
				return sourcePos;
			}

			for (const issue of issues) {
				const replacement = issue.negated ? "\\\\W" : "\\\\w";
				const adjustedStart = mapPositionToSource(issue.start);
				const adjustedEnd = mapPositionToSource(issue.end);

				context.report({
					data: {
						raw: issue.raw,
						replacement: issue.negated ? "\\W" : "\\w",
					},
					fix: {
						range: {
							begin: start + 1 + adjustedStart,
							end: start + 1 + adjustedEnd,
						},
						text: replacement,
					},
					message: "preferWord",
					range: {
						begin: start + 1 + adjustedStart,
						end: start + 1 + adjustedEnd,
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
