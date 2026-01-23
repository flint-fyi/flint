import {
	type AST as RegExpAST,
	visitRegExpAST,
} from "@eslint-community/regexpp";
import { typescriptLanguage } from "@flint.fyi/typescript-language";
import type { AST } from "@flint.fyi/typescript-language";
import * as ts from "typescript";

import { ruleCreator } from "./ruleCreator.ts";
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
			const regexpAst = parseRegexpAst(pattern, {
				unicode: flags.includes("u"),
				unicodeSets: flags.includes("v"),
			});

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
			{ sourceFile }: { sourceFile: ts.SourceFile },
		) {
			const text = node.getText(sourceFile);
			const match = /^\/(.*)\/([dgimsuyv]*)$/.exec(text);

			if (!match) {
				return;
			}

			const [, pattern, flags] = match;

			if (!pattern) {
				return;
			}

			const nodeStart = node.getStart(sourceFile);
			checkPattern(pattern, nodeStart + 1, flags ?? "");
		}

		function checkRegExpConstructor(
			node: AST.CallExpression | AST.NewExpression,
			{ sourceFile }: { sourceFile: ts.SourceFile },
		) {
			if (
				node.expression.kind !== ts.SyntaxKind.Identifier ||
				node.expression.text !== "RegExp"
			) {
				return;
			}

			const args = node.arguments;
			if (!args?.length) {
				return;
			}

			// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
			const firstArg = args[0]!;

			if (firstArg.kind !== ts.SyntaxKind.StringLiteral) {
				return;
			}

			const pattern = firstArg.text;
			const patternStart = firstArg.getStart(sourceFile) + 1;

			const secondArg = args[1];

			const flags =
				secondArg?.kind === ts.SyntaxKind.StringLiteral ? secondArg.text : "";

			checkPattern(pattern, patternStart, flags);
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
