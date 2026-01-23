import {
	type AST as RegExpAST,
	visitRegExpAST,
} from "@eslint-community/regexpp";
import { typescriptLanguage } from "@flint.fyi/typescript-language";
import type { AST } from "@flint.fyi/typescript-language";
import * as ts from "typescript";

import { ruleCreator } from "./ruleCreator.ts";
import { parseRegexpAst } from "./utils/parseRegexpAst.ts";

function* extractInvalidQuantifiers(
	alternatives: RegExpAST.Alternative[],
	kind: "lookahead" | "lookbehind",
): IterableIterator<RegExpAST.Quantifier> {
	for (const { elements } of alternatives) {
		if (elements.length === 0) {
			continue;
		}

		const lastIndex = kind === "lookahead" ? elements.length - 1 : 0;
		const last = elements[lastIndex];
		if (!last) {
			continue;
		}

		switch (last.type) {
			case "Group":
				yield* extractInvalidQuantifiers(last.alternatives, kind);
				break;
			case "Quantifier":
				if (last.min !== last.max) {
					if (!hasCapturingGroupDescendant(last.element)) {
						yield last;
					}
				}
				break;
		}
	}
}

function hasCapturingGroupDescendant(element: RegExpAST.Element): boolean {
	switch (element.type) {
		case "CapturingGroup":
			return true;
		case "Group": {
			for (const alternative of element.alternatives) {
				for (const child of alternative.elements) {
					if (hasCapturingGroupDescendant(child)) {
						return true;
					}
				}
			}
			return false;
		}
		case "Quantifier":
			return hasCapturingGroupDescendant(element.element);
		default:
			return false;
	}
}

export default ruleCreator.createRule(typescriptLanguage, {
	about: {
		description:
			"Reports non-constant quantifiers in lookaround assertions that could be simplified.",
		id: "regexLookaroundQuantifierOptimizations",
		presets: ["logical"],
	},
	messages: {
		remove: {
			primary:
				"Quantifier '{{ raw }}' at the {{ endOrStart }} of the {{ kind }} can be removed.",
			secondary: [
				"Non-constant quantifiers at the end of lookaheads or start of lookbehinds only match their minimum because the lookaround only checks for a match, not how much is matched.",
			],
			suggestions: ["Remove the quantifier."],
		},
		replace: {
			primary:
				"Quantifier '{{ raw }}' at the {{ endOrStart }} of the {{ kind }} can be replaced with '{{ replacer }}'.",
			secondary: [
				"Non-constant quantifiers at the end of lookaheads or start of lookbehinds only match their minimum because the lookaround only checks for a match, not how much is matched.",
			],
			suggestions: ["Replace the quantifier with the constant minimum."],
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
				onAssertionEnter(assertionNode) {
					if (
						assertionNode.kind !== "lookahead" &&
						assertionNode.kind !== "lookbehind"
					) {
						return;
					}

					const endOrStart =
						assertionNode.kind === "lookahead" ? "end" : "start";
					const kind = assertionNode.negate
						? `negative ${assertionNode.kind}`
						: assertionNode.kind;

					for (const quantifier of extractInvalidQuantifiers(
						assertionNode.alternatives,
						assertionNode.kind,
					)) {
						const replacer =
							quantifier.min === 0
								? ""
								: quantifier.min === 1
									? quantifier.element.raw
									: `${quantifier.element.raw}{${quantifier.min}}`;

						context.report({
							data: {
								endOrStart,
								kind,
								raw: quantifier.raw,
								replacer,
							},
							message: quantifier.min === 0 ? "remove" : "replace",
							range: {
								begin: patternStart + quantifier.start,
								end: patternStart + quantifier.end,
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
