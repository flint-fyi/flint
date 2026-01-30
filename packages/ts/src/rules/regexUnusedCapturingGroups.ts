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
			primary: "Capturing group `{{ raw }}` is never referenced.",
			secondary: [
				"Capturing groups that are never backreferenced can be misleading by unintentionally indicating that the group should be captured.",
				"Non-capturing groups are generally preferred for clarity when the group does not need to be captured.",
			],
			suggestions: [
				"Convert to a non-capturing group if the capture is not needed.",
				"Add a backreference if the capture is needed.",
			],
		},
	},
	setup(context) {
		function checkPattern(pattern: string, flags: string, start: number) {
			const unusedGroups = findUnusedCapturingGroups(pattern, flags);

			for (const group of unusedGroups) {
				const range = {
					begin: start + 1 + group.start,
					end: start + 1 + group.end,
				};

				const innerContent = group.alternatives.map((alt) => alt.raw).join("|");
				const nonCapturing = `(?:${innerContent})`;

				context.report({
					data: {
						raw: group.raw,
					},
					message: "unusedCapture",
					range,
					suggestions: [
						{
							id: "useNonCapturing",
							range,
							text: nonCapturing,
						},
					],
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
