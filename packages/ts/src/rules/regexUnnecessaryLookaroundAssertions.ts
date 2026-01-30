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

export default ruleCreator.createRule(typescriptLanguage, {
	about: {
		description:
			"Reports unnecessary nested lookaround assertions in regular expressions.",
		id: "regexUnnecessaryLookaroundAssertions",
		presets: ["logical"],
	},
	messages: {
		lookahead: {
			primary:
				"This lookahead assertion is unnecessary because it is at the end of another lookahead.",
			secondary: [],
			suggestions: ["Inline the nested pattern into the parent assertion."],
		},
		lookbehind: {
			primary:
				"This lookbehind assertion is unnecessary because it is at the start of another lookbehind.",
			secondary: [],
			suggestions: ["Inline the nested pattern into the parent assertion."],
		},
	},
	setup(context) {
		function reportElement(
			element: RegExpAST.Element,
			kind: "lookahead" | "lookbehind",
			patternStart: number,
		) {
			if (
				element.type === "Assertion" &&
				element.kind === kind &&
				!element.negate
			) {
				context.report({
					message: kind,
					range: {
						begin: patternStart + element.start,
						end: patternStart + element.end,
					},
				});
			}
		}

		function checkPattern(
			pattern: string,
			patternStart: number,
			flagsText: string,
		) {
			const regexpAst = parseRegexpAst(pattern, flagsText);
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

					for (const alternative of assertion.alternatives) {
						if (!alternative.elements.length) {
							continue;
						}

						if (assertion.kind === "lookahead") {
							// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
							const lastElement = alternative.elements.at(-1)!;
							reportElement(lastElement, "lookahead", patternStart);
						} else {
							// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
							const firstElement = alternative.elements[0]!;
							reportElement(firstElement, "lookbehind", patternStart);
						}
					}
				},
			});
		}

		function checkRegexLiteral(
			node: AST.RegularExpressionLiteral,
			services: TypeScriptFileServices,
		) {
			const { flags, pattern, start } = getRegExpLiteralDetails(node, services);
			checkPattern(pattern, start, flags);
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
			checkPattern(patternEscaped, construction.start + 1, construction.flags);
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
