import { typescriptLanguage } from "@flint.fyi/typescript-language";
import type { AST } from "@flint.fyi/typescript-language";
import * as ts from "typescript";

import { ruleCreator } from "./ruleCreator.ts";

const STANDARD_FLAGS = new Set(["d", "g", "i", "m", "s", "u", "v", "y"]);

export default ruleCreator.createRule(typescriptLanguage, {
	about: {
		description: "Reports non-standard regular expression flags.",
		id: "regexNonStandardFlags",
		presets: ["logical"],
	},
	messages: {
		unexpected: {
			primary:
				"Non-standard flag '{{ flag }}' is not part of the ECMAScript standard.",
			secondary: [
				"Non-standard flags may not be supported in all JavaScript environments and should be avoided in production code.",
			],
			suggestions: ["Remove the non-standard flag."],
		},
	},
	setup(context) {
		function checkFlags(flags: string, flagsStart: number) {
			for (let i = 0; i < flags.length; i++) {
				const flag = flags[i];
				if (flag && !STANDARD_FLAGS.has(flag)) {
					context.report({
						data: {
							flag,
						},
						message: "unexpected",
						range: {
							begin: flagsStart + i,
							end: flagsStart + i + 1,
						},
					});
				}
			}
		}

		function checkRegexLiteral(
			node: AST.RegularExpressionLiteral,
			{ sourceFile }: { sourceFile: ts.SourceFile },
		) {
			const text = node.getText(sourceFile);
			const match = /^\/.*\/([a-z]*)$/i.exec(text);

			if (!match) {
				return;
			}

			const [, flags] = match;

			if (!flags) {
				return;
			}

			const nodeStart = node.getStart(sourceFile);
			const flagsStart = nodeStart + text.length - flags.length;
			checkFlags(flags, flagsStart);
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
			if (!args || args.length < 2) {
				return;
			}

			const secondArgument = args[1];

			if (
				!secondArgument ||
				secondArgument.kind !== ts.SyntaxKind.StringLiteral
			) {
				return;
			}

			const flags = secondArgument.text;
			const flagsStart = secondArgument.getStart(sourceFile) + 1;
			checkFlags(flags, flagsStart);
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
