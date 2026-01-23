import {
	type AST as RegExpAST,
	visitRegExpAST,
} from "@eslint-community/regexpp";
import { typescriptLanguage } from "@flint.fyi/typescript-language";
import type { AST } from "@flint.fyi/typescript-language";
import * as ts from "typescript";

import { ruleCreator } from "./ruleCreator.ts";
import { parseRegexpAst } from "./utils/parseRegexpAst.ts";

function isEmptyGroup(
	group: RegExpAST.CapturingGroup | RegExpAST.Group,
): boolean {
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
			primary: "Empty {{ kind }} '{{ raw }}' matches nothing.",
			secondary: [
				"Empty groups match the empty string and have no effect on the regex.",
			],
		},
	},
	setup(context) {
		function checkPattern(
			node:
				| AST.CallExpression
				| AST.NewExpression
				| AST.RegularExpressionLiteral,
			pattern: string,
			patternStart: number,
			flags: string,
		) {
			const hasUnicode = flags.includes("u");
			const hasUnicodeSets = flags.includes("v");

			const regexpAst = parseRegexpAst(pattern, {
				unicode: hasUnicode,
				unicodeSets: hasUnicodeSets,
			});

			if (!regexpAst) {
				return;
			}

			function reportEmptyGroup(
				group: RegExpAST.CapturingGroup | RegExpAST.Group,
				kind: string,
			) {
				if (isEmptyGroup(group)) {
					context.report({
						data: {
							kind,
							raw: group.raw,
						},
						message: "emptyGroup",
						range: {
							begin: patternStart + group.start,
							end: patternStart + group.end,
						},
					});
				}
			}

			visitRegExpAST(regexpAst, {
				onCapturingGroupEnter(group) {
					reportEmptyGroup(group, "capturing group");
				},
				onGroupEnter(group) {
					reportEmptyGroup(group, "non-capturing group");
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
			checkPattern(node, pattern, nodeStart + 1, flags ?? "");
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
			if (!args || args.length === 0) {
				return;
			}

			const firstArg = args[0];
			if (!firstArg || firstArg.kind !== ts.SyntaxKind.StringLiteral) {
				return;
			}

			const pattern = firstArg.text;
			const patternStart = firstArg.getStart(sourceFile) + 1;

			let flags = "";
			const secondArg = args[1];
			if (secondArg?.kind === ts.SyntaxKind.StringLiteral) {
				flags = secondArg.text;
			}

			checkPattern(node, pattern, patternStart, flags);
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
