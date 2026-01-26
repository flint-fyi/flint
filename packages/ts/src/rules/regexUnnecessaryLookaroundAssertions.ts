import { visitRegExpAST } from "@eslint-community/regexpp";
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
						if (alternative.elements.length === 0) {
							continue;
						}

						if (assertion.kind === "lookahead") {
							const lastElement = alternative.elements.at(-1);
							if (
								lastElement?.type === "Assertion" &&
								lastElement.kind === "lookahead" &&
								!lastElement.negate
							) {
								context.report({
									message: "lookahead",
									range: {
										begin: patternStart + lastElement.start,
										end: patternStart + lastElement.end,
									},
								});
							}
						} else {
							const firstElement = alternative.elements[0];
							if (
								firstElement?.type === "Assertion" &&
								firstElement.kind === "lookbehind" &&
								!firstElement.negate
							) {
								context.report({
									message: "lookbehind",
									range: {
										begin: patternStart + firstElement.start,
										end: patternStart + firstElement.end,
									},
								});
							}
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
