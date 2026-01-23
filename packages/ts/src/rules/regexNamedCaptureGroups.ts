import { visitRegExpAST } from "@eslint-community/regexpp";
import {
	getTSNodeRange,
	typescriptLanguage,
} from "@flint.fyi/typescript-language";

import { ruleCreator } from "./ruleCreator.ts";
import { parseRegexpAst } from "./utils/parseRegexpAst.ts";

export default ruleCreator.createRule(typescriptLanguage, {
	about: {
		description:
			"Reports capturing groups in regular expressions that do not have a name.",
		id: "regexNamedCaptureGroups",
		presets: ["logical"],
	},
	messages: {
		preferNamed: {
			primary:
				"Capture group `{{ group }}` should be converted to a named or non-capturing group.",
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
		return {
			visitors: {
				RegularExpressionLiteral: (node, { sourceFile }) => {
					const match = /^\/(.+)\/([dgimsuyv]*)$/.exec(node.text);
					if (!match) {
						return;
					}

					const [, pattern, flagsStr = ""] = match;
					if (!pattern) {
						return;
					}

					const regexpAst = parseRegexpAst(pattern, flagsStr);
					if (!regexpAst) {
						return;
					}

					const range = getTSNodeRange(node, sourceFile);

					visitRegExpAST(regexpAst, {
						onCapturingGroupEnter(groupNode) {
							if (groupNode.name) {
								return;
							}

							context.report({
								data: {
									group: groupNode.raw,
								},
								message: "preferNamed",
								range: {
									begin: range.begin + 1 + groupNode.start,
									end: range.begin + 1 + groupNode.end,
								},
								suggestions: [
									{
										id: "addGroupName",
										range: {
											begin: range.begin + 1 + groupNode.start + 1,
											end: range.begin + 1 + groupNode.start + 1,
										},
										text: "?<name>",
									},
									{
										id: "convertToNonCapturing",
										range: {
											begin: range.begin + 1 + groupNode.start + 1,
											end: range.begin + 1 + groupNode.start + 1,
										},
										text: "?:",
									},
								],
							});
						},
					});
				},
			},
		};
	},
});
