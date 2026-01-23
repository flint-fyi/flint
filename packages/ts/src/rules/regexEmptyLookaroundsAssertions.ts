import {
	type AST as RegExpAST,
	visitRegExpAST,
} from "@eslint-community/regexpp";
import { typescriptLanguage } from "@flint.fyi/typescript-language";
import type { AST } from "@flint.fyi/typescript-language";
import * as ts from "typescript";

import { ruleCreator } from "./ruleCreator.ts";
import { parseRegexpAst } from "./utils/parseRegexpAst.ts";

function isAlternativeEmpty(alternative: RegExpAST.Alternative): boolean {
	return alternative.elements.every(isElementEmpty);
}

function isElementEmpty(element: RegExpAST.Element): boolean {
	switch (element.type) {
		case "Assertion":
			return true;
		case "Backreference":
		case "Character":
		case "CharacterClass":
		case "CharacterSet":
		case "ExpressionCharacterClass":
			return false;
		case "CapturingGroup":
		case "Group":
			return isPotentiallyEmpty(element.alternatives);
		case "Quantifier":
			return element.min === 0 || isElementEmpty(element.element);
		default:
			return false;
	}
}

function isPotentiallyEmpty(
	alternatives: readonly RegExpAST.Alternative[],
): boolean {
	return alternatives.some(isAlternativeEmpty);
}

export default ruleCreator.createRule(typescriptLanguage, {
	about: {
		description:
			"Reports empty lookahead and lookbehind assertions in regular expressions.",
		id: "regexEmptyLookaroundsAssertions",
		presets: ["logical"],
	},
	messages: {
		emptyLookaround: {
			primary: "Empty {{ kind }} will trivially {{ result }} all inputs.",
			secondary: [
				"Empty lookaround assertions match the empty string and will always succeed (or fail if negated) without checking anything meaningful.",
			],
			suggestions: [],
		},
	},
	setup(context) {
		function checkPattern(
			pattern: string,
			patternStart: number,
			flags: string,
		) {
			const hasUnicode = flags.includes("u");
			const hasUnicodeSets = flags.includes("v");

			const regexpAst = parseRegexpAst(pattern, {
				unicode: hasUnicode,
				unicodeSets: hasUnicodeSets,
			});

			if (!regexpAst) {
				return;
			}

			visitRegExpAST(regexpAst, {
				onAssertionEnter(assertion) {
					if (
						assertion.kind !== "lookahead" &&
						assertion.kind !== "lookbehind"
					) {
						return;
					}

					if (isPotentiallyEmpty(assertion.alternatives)) {
						context.report({
							data: {
								kind: assertion.kind,
								result: assertion.negate ? "reject" : "accept",
							},
							message: "emptyLookaround",
							range: {
								begin: patternStart + assertion.start,
								end: patternStart + assertion.end,
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
			if (!args || args.length === 0) {
				return;
			}

			const firstArg = args[0];
			if (!firstArg || firstArg.kind !== ts.SyntaxKind.StringLiteral) {
				return;
			}

			const pattern = firstArg.text;
			const patternStart = firstArg.getStart(sourceFile) + 1;

			let flags = "";
			const secondArg = args[1];
			if (secondArg?.kind === ts.SyntaxKind.StringLiteral) {
				flags = secondArg.text;
			}

			checkPattern(pattern, patternStart, flags);
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
