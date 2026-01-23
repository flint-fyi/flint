import { visitRegExpAST } from "@eslint-community/regexpp";
import { typescriptLanguage } from "@flint.fyi/typescript-language";
import type {
	AST,
	TypeScriptFileServices,
} from "@flint.fyi/typescript-language";
import { isPotentiallyEmpty } from "regexp-ast-analysis";

import { ruleCreator } from "./ruleCreator.ts";
import { getRegExpConstruction } from "./utils/getRegExpConstruction.ts";
import { parseRegexpAst } from "./utils/parseRegexpAst.ts";

function getRegexInfo(node: AST.RegularExpressionLiteral) {
	const lastSlash = node.text.lastIndexOf("/");
	return {
		flags: node.text.slice(lastSlash + 1),
		pattern: node.text.slice(1, lastSlash),
	};
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
			flagsStr: string,
		) {
			const regexpAst = parseRegexpAst(pattern, flagsStr);
			if (!regexpAst) {
				return;
			}

			const flags = {
				dotAll: flagsStr.includes("s"),
				global: flagsStr.includes("g"),
				hasIndices: flagsStr.includes("d"),
				ignoreCase: flagsStr.includes("i"),
				multiline: flagsStr.includes("m"),
				sticky: flagsStr.includes("y"),
				unicode: flagsStr.includes("u"),
				unicodeSets: flagsStr.includes("v"),
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
			{ sourceFile }: TypeScriptFileServices,
		) {
			const { flags, pattern } = getRegexInfo(node);
			const nodeStart = node.getStart(sourceFile);
			checkPattern(pattern, nodeStart + 1, flags);
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
