import {
	type AST as RegExpAST,
	visitRegExpAST,
} from "@eslint-community/regexpp";
import { typescriptLanguage } from "@flint.fyi/typescript-language";
import type { AST } from "@flint.fyi/typescript-language";
import * as ts from "typescript";

import { ruleCreator } from "./ruleCreator.ts";
import { parseRegexpAst } from "./utils/parseRegexpAst.ts";

function* extractLazyEndQuantifiers(
	alternatives: RegExpAST.Alternative[],
): IterableIterator<RegExpAST.Quantifier> {
	for (const { elements } of alternatives) {
		if (elements.length === 0) {
			continue;
		}

		const last = elements[elements.length - 1];
		if (!last) {
			continue;
		}

		switch (last.type) {
			case "Quantifier":
				if (!last.greedy && last.min !== last.max) {
					yield last;
				} else if (last.max === 1) {
					const element = last.element;
					if (element.type === "Group" || element.type === "CapturingGroup") {
						yield* extractLazyEndQuantifiers(element.alternatives);
					}
				}
				break;
			case "CapturingGroup":
			case "Group":
				yield* extractLazyEndQuantifiers(last.alternatives);
				break;
			default:
				break;
		}
	}
}

export default ruleCreator.createRule(typescriptLanguage, {
	about: {
		description: "Reports lazy quantifiers at the end of regular expressions.",
		id: "regexEmptyLazyQuantifiers",
		presets: ["logical"],
	},
	messages: {
		uselessElement: {
			primary:
				"Lazy quantifier '{{ raw }}' at end of pattern will only match the empty string.",
			secondary: [
				"Lazy quantifiers at the end of a pattern with minimum 0 will match nothing because there's nothing after them to satisfy.",
			],
		},
		uselessQuantifier: {
			primary:
				"Lazy quantifier '{{ raw }}' at end of pattern will always match exactly once.",
			secondary: [
				"Lazy quantifiers at the end of a pattern with minimum 1 will match exactly once because there's nothing after them to satisfy.",
			],
		},
		uselessRange: {
			primary:
				"Lazy quantifier '{{ raw }}' at end of pattern will always match exactly {{ min }} times.",
			secondary: [
				"Lazy quantifiers at the end of a pattern will match only their minimum because there's nothing after them to satisfy.",
			],
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
				onPatternEnter(patternNode) {
					for (const lazy of extractLazyEndQuantifiers(
						patternNode.alternatives,
					)) {
						const messageId =
							lazy.min === 0
								? "uselessElement"
								: lazy.min === 1
									? "uselessQuantifier"
									: "uselessRange";

						context.report({
							data: {
								min: String(lazy.min),
								raw: lazy.raw,
							},
							message: messageId,
							range: {
								begin: patternStart + lazy.start,
								end: patternStart + lazy.end,
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
