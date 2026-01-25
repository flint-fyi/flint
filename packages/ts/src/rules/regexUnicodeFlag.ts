import type { Fix } from "@flint.fyi/core";
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

function canAddUnicodeFlag(pattern: string, flags: string) {
	return (
		!hasUnicodeFlag(flags) && parseRegexpAst(pattern, flags + "u") !== undefined
	);
}

function hasUnicodeFlag(flags: string) {
	return flags.includes("u") || flags.includes("v");
}

export default ruleCreator.createRule(typescriptLanguage, {
	about: {
		description:
			"Require regex patterns to have the unicode ('u') or unicodeSets ('v') flag for proper Unicode character handling.",
		id: "regexUnicodeFlag",
	},
	messages: {
		missing: {
			primary:
				"This regular expression is missing the Unicode ('u') flag for proper Unicode character handling.",
			secondary: [
				"Without the unicode flag, regex patterns may fail to match Unicode characters correctly, especially surrogate pairs like emoji.",
			],
			suggestions: [
				"Add the `u` flag to enable unicode mode.",
				"Use the `v` flag for unicodeSets mode (ES2024).",
			],
		},
	},
	setup(context) {
		function checkRegexLiteral(
			node: AST.RegularExpressionLiteral,
			services: TypeScriptFileServices,
		) {
			const details = getRegExpLiteralDetails(node, services);
			if (hasUnicodeFlag(details.flags)) {
				return;
			}

			const nodeEnd = node.getEnd();

			context.report({
				fix: canAddUnicodeFlag(details.pattern, details.flags)
					? {
							range: { begin: details.start - 1, end: nodeEnd },
							text: `${node.getText(services.sourceFile)}u`,
						}
					: undefined,
				message: "missing",
				range: { begin: details.start - 1, end: nodeEnd },
			});
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

			const secondArgument = construction.args[1];
			const hasSecondArgument = secondArgument !== undefined;
			const secondIsStringLiteral =
				secondArgument?.kind === ts.SyntaxKind.StringLiteral;

			if (hasUnicodeFlag(construction.flags)) {
				return;
			}

			const nodeStart = node.getStart(services.sourceFile);
			const nodeEnd = node.getEnd();

			let fix: Fix | undefined;

			if (canAddUnicodeFlag(construction.raw, construction.flags)) {
				if (secondIsStringLiteral) {
					const secondStart = secondArgument.getStart(services.sourceFile);
					const secondEnd = secondArgument.getEnd();
					const quote = secondArgument.getText(services.sourceFile)[0];
					fix = {
						range: { begin: secondStart, end: secondEnd },
						text: `${quote}${construction.flags}u${quote}`,
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
