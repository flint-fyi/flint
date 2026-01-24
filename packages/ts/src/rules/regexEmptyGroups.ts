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

function isEmptyGroup(group: RegExpAST.CapturingGroup | RegExpAST.Group) {
	return group.alternatives.every(
		(alternative) => alternative.elements.length === 0,
	);
}

export default ruleCreator.createRule(typescriptLanguage, {
	about: {
		description: "Reports empty groups in regular expressions.",
		id: "regexEmptyGroups",
		presets: ["logical"],
	},
	messages: {
		emptyGroup: {
			primary: "Empty {{ kind }} `{{ raw }}` matches nothing.",
			secondary: [
				"Empty groups match the empty string and have no effect on the regex.",
			],
			suggestions: [
				"Remove the empty group.",
				"Replace the empty group with a non-capturing group.",
			],
		},
	},
	setup(context) {
		function reportEmptyGroup(
			group: RegExpAST.CapturingGroup | RegExpAST.Group,
			kind: string,
			start: number,
		) {
			if (isEmptyGroup(group)) {
				context.report({
					data: {
						kind,
						raw: group.raw,
					},
					message: "emptyGroup",
					range: {
						begin: start + group.start,
						end: start + group.end,
					},
				});
			}
		}

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
				onCapturingGroupEnter(group) {
					reportEmptyGroup(group, "capturing group", patternStart);
				},
				onGroupEnter(group) {
					reportEmptyGroup(group, "non-capturing group", patternStart);
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
			if (construction) {
				checkPattern(
					construction.pattern,
					construction.start + 1,
					construction.flags,
				);
			}
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
