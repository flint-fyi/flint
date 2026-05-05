import { typescriptLanguage } from "@flint.fyi/typescript-language";
import type {
	AST,
	TypeScriptFileServices,
} from "@flint.fyi/typescript-language";
import * as ts from "typescript";

import { ruleCreator } from "./ruleCreator.ts";
import { getRegExpConstruction } from "./utils/getRegExpConstruction.ts";
import { getRegExpLiteralDetails } from "./utils/getRegExpLiteralDetails.ts";
import { parseRegexpAst } from "./utils/parseRegexpAst.ts";

const validFlags = new Set(["d", "g", "i", "m", "s", "u", "v", "y"]);

export default ruleCreator.createRule(typescriptLanguage, {
	about: {
		description: "Reports invalid regular expressions.",
		id: "regexValidity",
		presets: ["logical"],
	},
	messages: {
		conflictingFlags: {
			primary: "The `u` and `v` flags cannot be used together.",
			secondary: ["These flags enable mutually exclusive Unicode modes."],
			suggestions: ["Use either `u` or `v`, but not both."],
		},
		duplicateFlag: {
			primary: "Duplicate regular expression flag `{{ flag }}`.",
			secondary: ["Each flag can only appear once."],
			suggestions: ["Remove the duplicate flag."],
		},
		invalidFlag: {
			primary: "Invalid regular expression flag `{{ flag }}`.",
			secondary: ["Valid flags are: d, g, i, m, s, u, v, y."],
			suggestions: ["Remove the invalid flag."],
		},
		invalidPattern: {
			primary: "Invalid regular expression pattern.",
			secondary: ["This RegExp constructor call will throw at runtime."],
			suggestions: ["Fix the regular expression syntax."],
		},
	},
	setup(context) {
		function checkFlags(flags: string, flagsStart: number) {
			const seenFlags = new Set<string>();
			let hasU = false;
			let hasV = false;
			let uPosition = -1;
			let vPosition = -1;
			let hasInvalidFlags = false;

			for (let i = 0; i < flags.length; i += 1) {
				// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
				const flag = flags[i]!;

				if (!validFlags.has(flag)) {
					hasInvalidFlags = true;
					context.report({
						data: { flag },
						message: "invalidFlag",
						range: {
							begin: flagsStart + i,
							end: flagsStart + i + 1,
						},
					});
					continue;
				}

				if (seenFlags.has(flag)) {
					hasInvalidFlags = true;
					context.report({
						data: { flag },
						message: "duplicateFlag",
						range: {
							begin: flagsStart + i,
							end: flagsStart + i + 1,
						},
					});
					continue;
				}

				seenFlags.add(flag);

				if (flag === "u") {
					hasU = true;
					uPosition = i;
				} else if (flag === "v") {
					hasV = true;
					vPosition = i;
				}
			}

			if (hasU && hasV) {
				hasInvalidFlags = true;
				const laterPosition = Math.max(uPosition, vPosition);
				context.report({
					message: "conflictingFlags",
					range: {
						begin: flagsStart + laterPosition,
						end: flagsStart + laterPosition + 1,
					},
				});
			}

			return hasInvalidFlags;
		}

		function checkPattern(
			pattern: string,
			flags: string,
			patternStart: number,
			patternEnd: number,
		) {
			const ast = parseRegexpAst(pattern, flags);
			if (ast === undefined) {
				context.report({
					message: "invalidPattern",
					range: {
						begin: patternStart,
						end: patternEnd,
					},
				});
			}
		}

		function checkRegexLiteral(
			node: AST.RegularExpressionLiteral,
			services: TypeScriptFileServices,
		) {
			const details = getRegExpLiteralDetails(node, services);
			const nodeStart = node.getStart(services.sourceFile);
			const flagsStart = nodeStart + node.text.length - details.flags.length;

			const hasInvalidFlags = checkFlags(details.flags, flagsStart);
			if (hasInvalidFlags) {
				return;
			}

			const patternStart = details.start;
			const patternEnd = flagsStart - 1;
			checkPattern(details.pattern, details.flags, patternStart, patternEnd);
		}

		function checkRegExpConstructor(
			node: AST.CallExpression | AST.NewExpression,
			services: TypeScriptFileServices,
		) {
			const construction = getRegExpConstruction(node, services);
			if (!construction) {
				return;
			}

			// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
			const firstArgument = construction.args[0]!;

			let hasInvalidFlags = false;
			if (construction.args.length >= 2) {
				// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
				const secondArgument = construction.args[1]!;
				if (secondArgument.kind === ts.SyntaxKind.StringLiteral) {
					const flagsStart = secondArgument.getStart(services.sourceFile) + 1;
					hasInvalidFlags = checkFlags(construction.flags, flagsStart);
				}
			}

			if (hasInvalidFlags) {
				return;
			}

			const patternStart = firstArgument.getStart(services.sourceFile) + 1;
			const patternEnd = firstArgument.getEnd() - 1;

			checkPattern(
				construction.raw,
				construction.flags,
				patternStart,
				patternEnd,
			);
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
