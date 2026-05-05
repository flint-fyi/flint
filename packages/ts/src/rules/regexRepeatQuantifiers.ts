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

function getSignature(element: RegExpAST.Element) {
	return element.type + ":" + element.raw;
}

function isFixableAtom(element: RegExpAST.Element): boolean {
	switch (element.type) {
		case "Backreference":
		case "CharacterClass":
		case "CharacterSet":
			return true;
		case "Character":
			return element.raw !== "{" && element.raw !== "}";
		default:
			return false;
	}
}

export default ruleCreator.createRule(typescriptLanguage, {
	about: {
		description:
			"Reports consecutive identical elements in regular expressions that should use quantifiers.",
		id: "regexRepeatQuantifiers",
		presets: ["stylistic", "stylisticStrict"],
	},
	messages: {
		preferQuantifier: {
			primary:
				"Prefer `{{ replacement }}` instead of repeating `{{ atom }}` {{ count }} times.",
			secondary: [
				"Using a quantifier is more concise than repeating the same element.",
			],
			suggestions: ["Replace with `{{ replacement }}`."],
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
				onAlternativeEnter(alternative) {
					const elements = alternative.elements;
					let index = 0;

					while (index < elements.length) {
						// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
						const element = elements[index]!;

						if (!isFixableAtom(element)) {
							index++;
							continue;
						}

						const signature = getSignature(element);
						let endIndex = index + 1;

						while (
							endIndex < elements.length &&
							// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
							isFixableAtom(elements[endIndex]!) &&
							// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
							getSignature(elements[endIndex]!) === signature
						) {
							endIndex++;
						}

						const count = endIndex - index;

						if (count >= 5) {
							const atomText = element.raw;
							const replacement = atomText + "{" + String(count) + "}";
							const runStart = element.start;
							// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
							const runEnd = elements[endIndex - 1]!.end;

							context.report({
								data: {
									atom: atomText,
									count: String(count),
									replacement,
								},
								fix: {
									range: {
										begin: patternStart + runStart,
										end: patternStart + runEnd,
									},
									text: replacement,
								},
								message: "preferQuantifier",
								range: {
									begin: patternStart + runStart,
									end: patternStart + runEnd,
								},
							});
						}

						index = endIndex;
					}
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
