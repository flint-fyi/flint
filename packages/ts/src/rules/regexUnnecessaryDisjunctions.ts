import { parseRegExpLiteral, visitRegExpAST } from "@eslint-community/regexpp";
import type {
	RegExpLiteral,
	StringAlternative,
} from "@eslint-community/regexpp/ast";
import {
	type AST,
	type TypeScriptFileServices,
	typescriptLanguage,
} from "@flint.fyi/typescript-language";

import { ruleCreator } from "./ruleCreator.ts";
import { getRegExpConstruction } from "./utils/getRegExpConstruction.ts";
import { getRegExpLiteralDetails } from "./utils/getRegExpLiteralDetails.ts";

function findUnnecessaryStringAlternatives(pattern: string, flags: string) {
	const results: StringAlternative[] = [];

	if (!flags.includes("v")) {
		return results;
	}

	let ast: RegExpLiteral;
	try {
		ast = parseRegExpLiteral(new RegExp(pattern, flags));
	} catch {
		return results;
	}

	visitRegExpAST(ast, {
		onStringAlternativeEnter(node: StringAlternative) {
			if (node.elements.length === 1) {
				results.push(node);
			}
		},
	});

	return results;
}

export default ruleCreator.createRule(typescriptLanguage, {
	about: {
		description:
			"Reports single-character alternatives in string disjunctions.",
		id: "regexUnnecessaryDisjunctions",
		presets: ["logical"],
	},
	messages: {
		unnecessary: {
			primary:
				"This string disjunction alternative contains only a single character.",
			secondary: [
				"Single-character alternatives in `\\q{...}` can be placed directly in the character class.",
			],
			suggestions: [
				"Extract the character from the `\\q{...}` into the surrounding character class.",
			],
		},
	},
	setup(context) {
		function checkRegexLiteral(
			node: AST.RegularExpressionLiteral,
			services: TypeScriptFileServices,
		) {
			const { flags, pattern, start } = getRegExpLiteralDetails(node, services);
			const unnecessaryAlternatives = findUnnecessaryStringAlternatives(
				pattern,
				flags,
			);

			for (const alternative of unnecessaryAlternatives) {
				context.report({
					message: "unnecessary",
					range: {
						begin: start + alternative.start - 1,
						end: start + alternative.end - 1,
					},
				});
			}
		}

		function checkRegExpConstructor(
			node: AST.CallExpression | AST.NewExpression,
			services: TypeScriptFileServices,
		) {
			const construction = getRegExpConstruction(node, services);
			if (!construction) {
				return;
			}

			const patternEscaped = construction.pattern.replace(/\\\\/g, "\\");
			const unnecessaryAlternatives = findUnnecessaryStringAlternatives(
				patternEscaped,
				construction.flags,
			);

			for (const alternative of unnecessaryAlternatives) {
				context.report({
					message: "unnecessary",
					range: {
						begin: construction.start + alternative.start,
						end: construction.start + alternative.end,
					},
				});
			}
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
