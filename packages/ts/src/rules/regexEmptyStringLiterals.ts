import { parseRegExpLiteral, visitRegExpAST } from "@eslint-community/regexpp";
import type {
	ClassStringDisjunction,
	RegExpLiteral,
} from "@eslint-community/regexpp/ast";
import {
	type AST,
	type TypeScriptFileServices,
	typescriptLanguage,
} from "@flint.fyi/typescript-language";

import { ruleCreator } from "./ruleCreator.ts";
import { getRegExpConstruction } from "./utils/getRegExpConstruction.ts";

function findEmptyStringLiterals(pattern: string, flags: string) {
	const results: ClassStringDisjunction[] = [];

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
		onClassStringDisjunctionEnter(node: ClassStringDisjunction) {
			if (
				node.alternatives.every(
					(alternative) => alternative.elements.length === 0,
				)
			) {
				results.push(node);
			}
		},
	});

	return results;
}

function getRegexInfo(node: AST.RegularExpressionLiteral) {
	const lastSlash = node.text.lastIndexOf("/");
	return {
		flags: node.text.slice(lastSlash + 1),
		pattern: node.text.slice(1, lastSlash),
	};
}

export default ruleCreator.createRule(typescriptLanguage, {
	about: {
		description: "Reports empty string literals in character classes.",
		id: "regexEmptyStringLiterals",
		presets: ["logical"],
	},
	messages: {
		emptyStringLiteral: {
			primary:
				"This empty string literal in a character class will always match the empty string.",
			secondary: [
				"The `\\q{}` string literal matches the empty string.",
				"This generally either does not benefit the regular expression or can cause unintended matches.",
			],
			suggestions: [
				"Remove the empty string literal if this was unintentional.",
				"Use a quantifier on the character class if this was intentional.",
			],
		},
	},
	setup(context) {
		function checkRegexLiteral(
			node: AST.RegularExpressionLiteral,
			services: TypeScriptFileServices,
		) {
			const { flags, pattern } = getRegexInfo(node);
			const emptyLiterals = findEmptyStringLiterals(pattern, flags);
			const nodeStart = node.getStart(services.sourceFile);

			for (const literal of emptyLiterals) {
				context.report({
					message: "emptyStringLiteral",
					range: {
						begin: nodeStart + literal.start,
						end: nodeStart + literal.end,
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

			const pattern = construction.pattern.replace(/\\\\/g, "\\");
			const emptyLiterals = findEmptyStringLiterals(
				pattern,
				construction.flags,
			);

			for (const literal of emptyLiterals) {
				context.report({
					message: "emptyStringLiteral",
					range: {
						begin: construction.start + literal.start,
						end: construction.start + literal.end,
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
