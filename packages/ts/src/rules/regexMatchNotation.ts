import {
	type AST as RegExpAST,
	visitRegExpAST,
} from "@eslint-community/regexpp";
import { typescriptLanguage } from "@flint.fyi/typescript-language";
import type { AST } from "@flint.fyi/typescript-language";
import * as ts from "typescript";

import { ruleCreator } from "./ruleCreator.ts";
import { parseRegexpAst } from "./utils/parseRegexpAst.ts";

const allowedNotation = String.raw`[\s\S]`;

function isMatchAnyCharacterClass(
	node: RegExpAST.CharacterClass,
	flags: { unicode: boolean; unicodeSets: boolean },
) {
	if (node.negate) {
		return node.elements.length === 0;
	}

	const positiveElements: {
		kind?: string;
		negate?: boolean;
		type: string;
	}[] = [];
	const negativeElements: {
		kind?: string;
		negate?: boolean;
		type: string;
	}[] = [];

	for (const element of node.elements) {
		if (element.type === "CharacterSet") {
			switch (element.kind) {
				case "digit":
					if (element.negate) {
						negativeElements.push({ kind: "digit", type: "CharacterSet" });
					} else {
						positiveElements.push({ kind: "digit", type: "CharacterSet" });
					}
					break;
				case "property": {
					if (!flags.unicode && !flags.unicodeSets) {
						break;
					}
					const key = `property:${element.key}:${element.value ?? ""}`;
					if (element.negate) {
						negativeElements.push({
							kind: key,
							negate: true,
							type: "CharacterSet",
						});
					} else {
						positiveElements.push({ kind: key, type: "CharacterSet" });
					}
					break;
				}
				case "space":
					if (element.negate) {
						negativeElements.push({ kind: "space", type: "CharacterSet" });
					} else {
						positiveElements.push({ kind: "space", type: "CharacterSet" });
					}
					break;
				case "word":
					if (element.negate) {
						negativeElements.push({ kind: "word", type: "CharacterSet" });
					} else {
						positiveElements.push({ kind: "word", type: "CharacterSet" });
					}
					break;
				default:
					break;
			}
		} else if (
			element.type === "CharacterClassRange" &&
			element.min.value === 0 &&
			(element.max.value === 0xffff ||
				element.max.value === 0x10ffff ||
				(flags.unicode && element.max.value >= 0x10ffff))
		) {
			return true;
		}
	}

	for (const positive of positiveElements) {
		const matchingNegative = negativeElements.find(
			(negative) => negative.kind === positive.kind,
		);
		if (matchingNegative) {
			return true;
		}
	}

	const hasSpace = positiveElements.some((e) => e.kind === "space");
	const hasNonSpace = negativeElements.some((e) => e.kind === "space");
	if (hasSpace && hasNonSpace) {
		return true;
	}

	const hasDigit = positiveElements.some((e) => e.kind === "digit");
	const hasNonDigit = negativeElements.some((e) => e.kind === "digit");
	if (hasDigit && hasNonDigit) {
		return true;
	}

	const hasWord = positiveElements.some((e) => e.kind === "word");
	const hasNonWord = negativeElements.some((e) => e.kind === "word");
	if (hasWord && hasNonWord) {
		return true;
	}

	return false;
}

export default ruleCreator.createRule(typescriptLanguage, {
	about: {
		description:
			"Reports inconsistent notations for matching any character in regular expressions.",
		id: "regexMatchNotation",
		presets: ["stylisticStrict"],
	},
	messages: {
		unexpected: {
			primary:
				"For consistency, prefer '{{ preferred }}' over '{{ raw }}' to match any character.",
			secondary: [
				"Using a consistent notation for matching any character improves readability.",
			],
			suggestions: ["Replace with the standard notation."],
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

			const flagsInfo = {
				dotAll: flags.includes("s"),
				unicode: flags.includes("u"),
				unicodeSets: flags.includes("v"),
			};

			visitRegExpAST(regexpAst, {
				onCharacterClassEnter(ccNode) {
					if (
						isMatchAnyCharacterClass(ccNode, flagsInfo) &&
						ccNode.raw !== allowedNotation
					) {
						const preferred = flagsInfo.dotAll ? "." : allowedNotation;
						context.report({
							data: {
								preferred,
								raw: ccNode.raw,
							},
							message: "unexpected",
							range: {
								begin: patternStart + ccNode.start,
								end: patternStart + ccNode.end,
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
