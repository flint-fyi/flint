import { visitRegExpAST } from "@eslint-community/regexpp";
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

export default ruleCreator.createRule(typescriptLanguage, {
	about: {
		description:
			"Reports capturing groups in regular expressions that do not have a name.",
		id: "regexNamedCaptureGroups",
	},
	messages: {
		preferNamed: {
			primary:
				"Anonymous capture group `{{ group }}` should be converted to a named or non-capturing group for clarity.",
			secondary: [
				"Named capture groups make regex patterns more readable and maintainable.",
				"If the capture is not needed, use a non-capturing group `(?:...)` instead.",
			],
			suggestions: [
				"Add a name to the capture group.",
				"Convert to a non-capturing group.",
			],
		},
	},
	setup(context) {
		function checkPattern(pattern: string, flags: string, start: number) {
			const regexpAst = parseRegexpAst(pattern, flags);
			if (!regexpAst) {
				return;
			}

			visitRegExpAST(regexpAst, {
				onCapturingGroupEnter(groupNode) {
					if (groupNode.name) {
						return;
					}

					const suggestionRange = {
						begin: start + 1 + groupNode.start + 1,
						end: start + 1 + groupNode.start + 1,
					};

					context.report({
						data: {
							group: groupNode.raw,
						},
						message: "preferNamed",
						range: {
							begin: start + 1 + groupNode.start,
							end: start + 1 + groupNode.end,
						},
						suggestions: [
							{
								id: "addGroupName",
								range: suggestionRange,
								text: "?<name>",
							},
							{
								id: "convertToNonCapturing",
								range: suggestionRange,
								text: "?:",
							},
						],
					});
				},
			});
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
