import {
	type AST as RegExpAST,
	visitRegExpAST,
} from "@eslint-community/regexpp";
import { typescriptLanguage } from "@flint.fyi/typescript-language";
import type { AST } from "@flint.fyi/typescript-language";
import * as ts from "typescript";

import { ruleCreator } from "./ruleCreator.ts";
import { parseRegexpAst } from "./utils/parseRegexpAst.ts";

function formatQuantifier(min: number, max: number, greedy: boolean): string {
	let result: string;
	if (min === 0 && max === 1) {
		result = "?";
	} else if (min === 0 && max === Infinity) {
		result = "*";
	} else if (min === 1 && max === Infinity) {
		result = "+";
	} else if (min === max) {
		result = `{${min}}`;
	} else if (max === Infinity) {
		result = `{${min},}`;
	} else {
		result = `{${min},${max}}`;
	}

	return greedy ? result : `${result}?`;
}

function isPotentiallyEmpty(element: RegExpAST.Element): boolean {
	switch (element.type) {
		case "Assertion":
			return true;
		case "Backreference":
			return true;
		case "CapturingGroup":
		case "Group":
			return element.alternatives.some((alt) =>
				alt.elements.every((el) => isPotentiallyEmpty(el)),
			);
		case "Character":
		case "CharacterClass":
		case "CharacterSet":
			return false;
		case "Quantifier":
			return element.min === 0 || isPotentiallyEmpty(element.element);
		default:
			return false;
	}
}

export default ruleCreator.createRule(typescriptLanguage, {
	about: {
		description:
			"Reports quantifiers whose minimum implies they must match but whose element can match empty.",
		id: "regexMisleadingQuantifiers",
		presets: ["logical"],
	},
	messages: {
		confusing: {
			primary:
				"Quantifier minimum is {{ min }} but the element can match empty. Consider using '{{ proposal }}' instead.",
			secondary: [
				"This quantifier suggests it must match at least {{ min }} time(s), but the quantified element can match the empty string, so the effective minimum is 0.",
			],
			suggestions: [
				"Replace the quantifier with one that reflects the actual minimum.",
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
				onQuantifierEnter(qNode) {
					if (qNode.min > 0 && isPotentiallyEmpty(qNode.element)) {
						const proposal = formatQuantifier(0, qNode.max, qNode.greedy);

						context.report({
							data: {
								min: qNode.min,
								proposal,
							},
							message: "confusing",
							range: {
								begin: patternStart + qNode.start,
								end: patternStart + qNode.end,
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
