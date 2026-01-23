import { typescriptLanguage } from "@flint.fyi/typescript-language";
import type { AST } from "@flint.fyi/typescript-language";
import * as ts from "typescript";

import { ruleCreator } from "./ruleCreator.ts";
import { parseRegexpAst } from "./utils/parseRegexpAst.ts";

function canAddUnicodeFlag(pattern: string, flags: string) {
	if (hasUnicodeFlag(flags)) {
		return false;
	}
	return parseRegexpAst(pattern, flags + "u") !== undefined;
}

function hasUnicodeFlag(flags: string) {
	return flags.includes("u") || flags.includes("v");
}

export default ruleCreator.createRule(typescriptLanguage, {
	about: {
		description:
			"Require regex patterns to have the unicode ('u') or unicodeSets ('v') flag for proper Unicode character handling.",
		id: "regexUnicodeFlag",
		presets: ["logical"],
	},
	messages: {
		missing: {
			primary:
				"Add the Unicode ('u') flag to this regular expression for proper Unicode character handling.",
			secondary: [
				"Without the unicode flag, regex patterns may fail to match Unicode characters correctly, especially surrogate pairs like emoji.",
			],
			suggestions: [
				"Add the 'u' flag to enable unicode mode, or use the 'v' flag for unicodeSets mode (ES2024).",
			],
		},
	},
	setup(context) {
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

			if (!pattern || hasUnicodeFlag(flags ?? "")) {
				return;
			}

			const nodeStart = node.getStart(sourceFile);
			const nodeEnd = node.getEnd();

			context.report({
				fix: canAddUnicodeFlag(pattern, flags ?? "")
					? {
							range: { begin: nodeStart, end: nodeEnd },
							text: `${text}u`,
						}
					: undefined,
				message: "missing",
				range: { begin: nodeStart, end: nodeEnd },
			});
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

			if (args.some((argument) => ts.isSpreadElement(argument))) {
				return;
			}

			const firstArgument = args[0];

			if (
				!firstArgument ||
				firstArgument.kind !== ts.SyntaxKind.StringLiteral
			) {
				return;
			}

			let flags = "";
			const secondArgument = args[1];
			const hasSecondArgument = secondArgument !== undefined;
			const secondIsStringLiteral =
				secondArgument?.kind === ts.SyntaxKind.StringLiteral;

			if (secondIsStringLiteral) {
				flags = secondArgument.text;
			}

			if (hasUnicodeFlag(flags)) {
				return;
			}

			const nodeStart = node.getStart(sourceFile);
			const nodeEnd = node.getEnd();

			let fix:
				| undefined
				| { range: { begin: number; end: number }; text: string };

			if (canAddUnicodeFlag(firstArgument.text, flags)) {
				if (secondIsStringLiteral) {
					const secondStart = secondArgument.getStart(sourceFile);
					const secondEnd = secondArgument.getEnd();
					const quote = secondArgument.getText(sourceFile)[0];
					fix = {
						range: { begin: secondStart, end: secondEnd },
						text: `${quote}${flags}u${quote}`,
					};
				} else if (!hasSecondArgument) {
					const firstEnd = firstArgument.getEnd();
					fix = {
						range: { begin: firstEnd, end: firstEnd },
						text: `, "u"`,
					};
				}
			}

			context.report({
				fix,
				message: "missing",
				range: { begin: nodeStart, end: nodeEnd },
			});
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
