import { visitRegExpAST } from "@eslint-community/regexpp";
import type { CapturingGroup } from "@eslint-community/regexpp/ast";
import {
	type AST,
	getTSNodeRange,
	type TypeScriptFileServices,
	typescriptLanguage,
} from "@flint.fyi/typescript-language";

import { ruleCreator } from "./ruleCreator.ts";
import { getRegExpConstruction } from "./utils/getRegExpConstruction.ts";
import { getRegExpLiteralDetails } from "./utils/getRegExpLiteralDetails.ts";
import { parseRegexpAst } from "./utils/parseRegexpAst.ts";

function findUnusedCapturingGroups(pattern: string, flags: string) {
	const results: CapturingGroup[] = [];

	const ast = parseRegexpAst(pattern, flags);
	if (!ast) {
		return results;
	}

	visitRegExpAST(ast, {
		onCapturingGroupEnter(node: CapturingGroup) {
			if (node.references.length === 0) {
				results.push(node);
			}
		},
	});

	return results;
}

export default ruleCreator.createRule(typescriptLanguage, {
	about: {
		description:
			"Reports capturing groups in regular expressions that are never referenced.",
		id: "regexUnusedCapturingGroups",
		presets: ["logical"],
	},
	messages: {
		unusedCapture: {
			primary: "Capturing group '{{ raw }}' is never referenced.",
			secondary: [
				"Capturing groups that are never backreferenced can be converted to non-capturing groups for clarity.",
			],
			suggestions: [
				"Convert to a non-capturing group: (?:...)",
				"Add a backreference if the capture is needed.",
			],
		},
	},
	setup(context) {
		function checkPattern(pattern: string, flags: string, start: number) {
			const unusedGroups = findUnusedCapturingGroups(pattern, flags);

			for (const group of unusedGroups) {
				context.report({
					data: {
						raw: group.raw,
					},
					message: "unusedCapture",
					range: {
						begin: start + 1 + group.start,
						end: start + 1 + group.end,
					},
				});
			}
		}

		function checkRegexLiteral(
			node: AST.RegularExpressionLiteral,
			services: TypeScriptFileServices,
		) {
			const details = getRegExpLiteralDetails(node, services);
			const range = getTSNodeRange(node, services.sourceFile);
			checkPattern(details.pattern, details.flags, range.begin);
		}

		function checkRegExpConstructor(
			node: AST.CallExpression | AST.NewExpression,
			services: TypeScriptFileServices,
		) {
			const construction = getRegExpConstruction(node, services);
			if (!construction) {
				return;
			}

			checkPattern(construction.raw, construction.flags, construction.start);
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
