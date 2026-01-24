import { typescriptLanguage } from "@flint.fyi/typescript-language";
import type {
	AST,
	TypeScriptFileServices,
} from "@flint.fyi/typescript-language";
import * as ts from "typescript";

import { ruleCreator } from "./ruleCreator.ts";
import { getRegExpConstruction } from "./utils/getRegExpConstruction.ts";
import { getRegExpLiteralDetails } from "./utils/getRegExpLiteralDetails.ts";

const standardFlags = new Set(["d", "g", "i", "m", "s", "u", "v", "y"]);

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
			for (let i = 0; i < flags.length; i += 1) {
				// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
				const flag = flags[i]!;
				if (!standardFlags.has(flag)) {
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
			services: TypeScriptFileServices,
		) {
			const details = getRegExpLiteralDetails(node, services);
			checkFlags(
				details.flags,
				details.start + node.text.length - details.flags.length - 1,
			);
		}

		function checkRegExpConstructor(
			node: AST.CallExpression | AST.NewExpression,
			services: TypeScriptFileServices,
		) {
			const construction = getRegExpConstruction(node, services);
			if (!construction) {
				return;
			}

			const args = construction.args;
			if (args.length < 2) {
				return;
			}

			// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
			const secondArgument = args[1]!;

			if (secondArgument.kind !== ts.SyntaxKind.StringLiteral) {
				return;
			}

			const flagsStart = secondArgument.getStart(services.sourceFile) + 1;
			checkFlags(construction.flags, flagsStart);
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
