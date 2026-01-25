import { visitRegExpAST } from "@eslint-community/regexpp";
import { typescriptLanguage } from "@flint.fyi/typescript-language";
import type {
	AST,
	TypeScriptFileServices,
} from "@flint.fyi/typescript-language";
import { isPotentiallyEmpty } from "regexp-ast-analysis";

import { ruleCreator } from "./ruleCreator.ts";
import { getRegExpConstruction } from "./utils/getRegExpConstruction.ts";
import { getRegExpLiteralDetails } from "./utils/getRegExpLiteralDetails.ts";
import { parseRegexpAst } from "./utils/parseRegexpAst.ts";

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
			flagsText: string,
		) {
			const regexpAst = parseRegexpAst(pattern, flagsText);
			if (!regexpAst) {
				return;
			}

			const flags = {
				dotAll: flagsText.includes("s"),
				global: flagsText.includes("g"),
				hasIndices: flagsText.includes("d"),
				ignoreCase: flagsText.includes("i"),
				multiline: flagsText.includes("m"),
				sticky: flagsText.includes("y"),
				unicode: flagsText.includes("u"),
				unicodeSets: flagsText.includes("v"),
			};

			visitRegExpAST(regexpAst, {
				onAssertionEnter(assertion) {
					if (
						assertion.kind !== "lookahead" &&
						assertion.kind !== "lookbehind"
					) {
						return;
					}

					if (isPotentiallyEmpty(assertion.alternatives, flags)) {
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
