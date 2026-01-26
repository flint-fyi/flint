import { parseRegExpLiteral, visitRegExpAST } from "@eslint-community/regexpp";
import type {
	ClassStringDisjunction,
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

interface UnnecessaryAlternativeInfo {
	alternative: StringAlternative;
	disjunction: ClassStringDisjunction;
}

function computeFixedPattern(
	pattern: string,
	infos: UnnecessaryAlternativeInfo[],
): string {
	const disjunctionMap = new Map<ClassStringDisjunction, StringAlternative[]>();

	for (const info of infos) {
		const existing = disjunctionMap.get(info.disjunction);
		if (existing) {
			existing.push(info.alternative);
		} else {
			disjunctionMap.set(info.disjunction, [info.alternative]);
		}
	}

	const replacements: { end: number; start: number; text: string }[] = [];

	for (const [disjunction, singleCharAlts] of disjunctionMap) {
		const singleCharSet = new Set(singleCharAlts);
		const remainingAlts = disjunction.alternatives.filter(
			(alt) => !singleCharSet.has(alt),
		);

		const extractedChars = singleCharAlts.map((alt) => alt.raw);

		let replacement: string;
		if (remainingAlts.length === 0) {
			replacement = extractedChars.join("");
		} else {
			const remainingDisjunction = `\\q{${remainingAlts.map((alt) => alt.raw).join("|")}}`;
			replacement = extractedChars.join("") + remainingDisjunction;
		}

		replacements.push({
			end: disjunction.end - 1,
			start: disjunction.start - 1,
			text: replacement,
		});
	}

	replacements.sort((a, b) => b.start - a.start);

	let result = pattern;
	for (const rep of replacements) {
		result = result.slice(0, rep.start) + rep.text + result.slice(rep.end);
	}

	return result;
}

function findUnnecessaryStringAlternatives(pattern: string, flags: string) {
	const results: UnnecessaryAlternativeInfo[] = [];

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
				results.push({
					alternative: node,
					disjunction: node.parent,
				});
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
				"This single-character disjunction alternative can be inlined into the surrounding character class.",
			secondary: [
				"Single-character alternatives in `\\q{...}` are equivalent to using the character directly.",
				"Their parent character class can be simplified by replacing the alternative with the character.",
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

			if (unnecessaryAlternatives.length === 0) {
				return;
			}

			const fixedPattern = computeFixedPattern(
				pattern,
				unnecessaryAlternatives,
			);
			const nodeRange = {
				begin: start - 1,
				end: start + pattern.length + flags.length + 1,
			};

			for (const info of unnecessaryAlternatives) {
				context.report({
					fix: {
						range: nodeRange,
						text: `/${fixedPattern}/${flags}`,
					},
					message: "unnecessary",
					range: {
						begin: start + info.alternative.start - 1,
						end: start + info.alternative.end - 1,
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

			if (unnecessaryAlternatives.length === 0) {
				return;
			}

			const fixedPattern = computeFixedPattern(
				patternEscaped,
				unnecessaryAlternatives,
			);
			const fixedPatternEscaped = fixedPattern.replace(/\\/g, "\\\\");

			for (const info of unnecessaryAlternatives) {
				context.report({
					fix: {
						range: {
							begin: construction.start + 1,
							end: construction.start + 1 + construction.pattern.length,
						},
						text: fixedPatternEscaped,
					},
					message: "unnecessary",
					range: {
						begin: construction.start + info.alternative.start,
						end: construction.start + info.alternative.end,
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
