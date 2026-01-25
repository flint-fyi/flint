import {
	type AST,
	type TypeScriptFileServices,
	typescriptLanguage,
} from "@flint.fyi/typescript-language";
import { analyse, type ParsedLiteral } from "scslre";

import { ruleCreator } from "./ruleCreator.ts";
import { getRegExpConstruction } from "./utils/getRegExpConstruction.ts";
import { getRegExpLiteralDetails } from "./utils/getRegExpLiteralDetails.ts";
import { parseRegexpAstFull } from "./utils/parseRegexpAstFull.ts";

function mentionQuantifier(quantifier: { raw: string }) {
	return `'${quantifier.raw}'`;
}

export default ruleCreator.createRule(typescriptLanguage, {
	about: {
		description:
			"Reports regular expressions with exponential or polynomial backtracking.",
		id: "regexSuperLinearBacktracking",
		presets: ["logical"],
	},
	messages: {
		self: {
			primary:
				"Quantifier {{ quant }} can reach itself via {{ parentQuant }}, causing {{ complexity }} backtracking.",
			secondary: [
				"This pattern can be exploited to cause denial of service (ReDoS) attacks.",
				"Using any string accepted by {{ attack }}, the regex can be forced to backtrack excessively.",
			],
			suggestions: [
				"Make the inner quantifier possessive or use atomic groups.",
				"Rewrite the pattern to remove the self-referential quantifier.",
			],
		},
		trade: {
			primary:
				"Quantifiers {{ startQuant }} and {{ endQuant }} can exchange characters, causing {{ complexity }} backtracking.",
			secondary: [
				"This pattern can be exploited to cause denial of service (ReDoS) attacks.",
				"Using any string accepted by {{ attack }}, the regex can be forced to backtrack excessively.",
			],
			suggestions: [
				"Make one of the quantifiers possessive or use atomic groups.",
				"Rewrite the pattern to remove the ambiguity between quantifiers.",
			],
		},
	},
	setup(context) {
		function analyseAndReport(
			parsed: ParsedLiteral,
			patternStart: number,
			flags: string,
		) {
			let result: ReturnType<typeof analyse>;
			try {
				result = analyse(parsed, {
					reportTypes: { Move: false },
				});
			} catch {
				return;
			}

			for (const report of result.reports) {
				const complexity = report.exponential ? "exponential" : "polynomial";
				const attack = `/${report.character.literal.source}+/${flags.includes("i") ? "i" : ""}`;

				if (report.type === "Self") {
					const quantStart = patternStart + report.quant.start;
					const quantEnd = patternStart + report.quant.end;

					context.report({
						data: {
							attack,
							complexity,
							parentQuant: mentionQuantifier(report.parentQuant),
							quant: mentionQuantifier(report.quant),
						},
						message: "self",
						range: {
							begin: quantStart,
							end: quantEnd,
						},
					});
				} else if (report.type === "Trade") {
					const startQuantStart = patternStart + report.startQuant.start;
					const endQuantEnd = patternStart + report.endQuant.end;

					context.report({
						data: {
							attack,
							complexity,
							endQuant: mentionQuantifier(report.endQuant),
							startQuant: mentionQuantifier(report.startQuant),
						},
						message: "trade",
						range: {
							begin: startQuantStart,
							end: endQuantEnd,
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
			const parsed = parseRegexpAstFull(details.pattern, details.flags);
			if (!parsed) {
				return;
			}

			analyseAndReport(parsed, details.start, details.flags);
		}

		function checkRegExpConstructor(
			node: AST.CallExpression | AST.NewExpression,
			services: TypeScriptFileServices,
		) {
			const construction = getRegExpConstruction(node, services);
			if (!construction) {
				return;
			}

			const parsed = parseRegexpAstFull(
				construction.pattern,
				construction.flags,
			);
			if (!parsed) {
				return;
			}

			analyseAndReport(parsed, construction.start + 1, construction.flags);
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
