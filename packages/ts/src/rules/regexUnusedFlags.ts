import {
	type AST as RegExpAST,
	visitRegExpAST,
} from "@eslint-community/regexpp";
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

interface PatternUsage {
	hasAnchor: boolean;
	hasDot: boolean;
	hasLetter: boolean;
}

type UnusedFlag = "i" | "m" | "s";

function analyzePattern(pattern: RegExpAST.Pattern): PatternUsage {
	const usage: PatternUsage = {
		hasAnchor: false,
		hasDot: false,
		hasLetter: false,
	};

	visitRegExpAST(pattern, {
		onAssertionEnter(node) {
			if (node.kind === "start" || node.kind === "end") {
				usage.hasAnchor = true;
			}
		},
		onCharacterClassRangeEnter(node) {
			if (rangeContainsLetter(node.min.value, node.max.value)) {
				usage.hasLetter = true;
			}
		},
		onCharacterEnter(node) {
			if (isAsciiLetter(node.value)) {
				usage.hasLetter = true;
			}
		},
		onCharacterSetEnter(node) {
			if (node.kind === "any") {
				usage.hasDot = true;
			}
		},
	});

	return usage;
}

function findUnusedFlags(pattern: string, flags: string): UnusedFlag[] {
	const regexpAst = parseRegexpAst(pattern, flags);
	if (!regexpAst) {
		return [];
	}

	const usage = analyzePattern(regexpAst);
	const unusedFlags: UnusedFlag[] = [];

	if (flags.includes("i") && !usage.hasLetter) {
		unusedFlags.push("i");
	}

	if (flags.includes("m") && !usage.hasAnchor) {
		unusedFlags.push("m");
	}

	if (flags.includes("s") && !usage.hasDot) {
		unusedFlags.push("s");
	}

	return unusedFlags;
}

function isAsciiLetter(codePoint: number) {
	return (
		(codePoint >= 0x41 && codePoint <= 0x5a) ||
		(codePoint >= 0x61 && codePoint <= 0x7a)
	);
}

function rangeContainsLetter(min: number, max: number) {
	return (min <= 0x5a && max >= 0x41) || (min <= 0x7a && max >= 0x61);
}

export default ruleCreator.createRule(typescriptLanguage, {
	about: {
		description:
			"Reports regular expression flags that have no effect on the pattern.",
		id: "regexUnusedFlags",
		presets: ["logical"],
	},
	messages: {
		unusedDotAll: {
			primary:
				"The `s` flag has no effect because the pattern contains no dots.",
			secondary: ["The dotAll flag only affects the . metacharacter."],
			suggestions: ["Remove the 's' flag."],
		},
		unusedIgnoreCase: {
			primary:
				"The `i` flag has no effect because the pattern contains no letters.",
			secondary: [
				"The ignoreCase flag only affects matching of ASCII letters (A-Za-z).",
			],
			suggestions: ["Remove the 'i' flag."],
		},
		unusedMultiline: {
			primary:
				"The `m` flag has no effect because the pattern contains no line anchors.",
			secondary: ["The multiline flag only affects the ^ and $ anchors."],
			suggestions: ["Remove the 'm' flag."],
		},
	},
	setup(context) {
		function reportUnusedFlags(
			unusedFlags: UnusedFlag[],
			flags: string,
			flagsStart: number,
		) {
			for (const flag of unusedFlags) {
				const flagIndex = flags.indexOf(flag);
				const message =
					flag === "i"
						? "unusedIgnoreCase"
						: flag === "m"
							? "unusedMultiline"
							: "unusedDotAll";

				const range = {
					begin: flagsStart + flagIndex,
					end: flagsStart + flagIndex + 1,
				};
				context.report({
					fix: {
						range,
						text: "",
					},
					message,
					range,
				});
			}
		}

		function checkRegexLiteral(
			node: AST.RegularExpressionLiteral,
			services: TypeScriptFileServices,
		) {
			const details = getRegExpLiteralDetails(node, services);
			const unusedFlags = findUnusedFlags(details.pattern, details.flags);
			if (!unusedFlags.length) {
				return;
			}

			const flagsStart =
				details.start + node.text.length - details.flags.length - 1;
			reportUnusedFlags(unusedFlags, details.flags, flagsStart);
		}

		function checkRegExpConstructor(
			node: AST.CallExpression | AST.NewExpression,
			services: TypeScriptFileServices,
		) {
			const construction = getRegExpConstruction(node, services);
			if (!construction || construction.args.length < 2) {
				return;
			}

			const unusedFlags = findUnusedFlags(construction.raw, construction.flags);
			if (!unusedFlags.length) {
				return;
			}

			// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
			const secondArgument = construction.args[1]!;
			if (secondArgument.kind !== ts.SyntaxKind.StringLiteral) {
				return;
			}

			const flagsStart = secondArgument.getStart(services.sourceFile) + 1;
			reportUnusedFlags(unusedFlags, construction.flags, flagsStart);
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
