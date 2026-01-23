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
import * as ts from "typescript";

import { ruleCreator } from "./ruleCreator.ts";

interface EmptyStringLiteral {
	end: number;
	start: number;
}

function findEmptyStringLiterals(
	pattern: string,
	flags: string,
): EmptyStringLiteral[] {
	const results: EmptyStringLiteral[] = [];

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
			const allEmpty = node.alternatives.every(
				(alt) => alt.elements.length === 0,
			);

			if (allEmpty) {
				results.push({
					end: node.end,
					start: node.start,
				});
			}
		},
	});

	return results;
}

function getRegexInfo(node: AST.RegularExpressionLiteral) {
	const text = node.text;
	const lastSlash = text.lastIndexOf("/");
	return {
		flags: text.slice(lastSlash + 1),
		pattern: text.slice(1, lastSlash),
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
			primary: "Empty string literal in character class.",
			secondary: [
				"The `\\q{}` string literal matches the empty string.",
				"Use a quantifier instead if this is intentional.",
			],
			suggestions: [
				"Remove the empty string literal or use a quantifier on the character class.",
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
			if (
				node.expression.kind !== ts.SyntaxKind.Identifier ||
				node.expression.text !== "RegExp"
			) {
				return;
			}

			const args = node.arguments;
			if (!args || args.length === 0) {
				return;
			}

			const patternArg = args[0];
			if (!patternArg || patternArg.kind !== ts.SyntaxKind.StringLiteral) {
				return;
			}

			const rawText = patternArg.getText(services.sourceFile);
			const pattern = rawText.slice(1, -1).replace(/\\\\/g, "\\");

			let flags = "";
			if (args.length >= 2) {
				const flagsArg = args[1];
				if (flagsArg?.kind === ts.SyntaxKind.StringLiteral) {
					const flagsText = flagsArg.getText(services.sourceFile);
					flags = flagsText.slice(1, -1);
				}
			}

			const emptyLiterals = findEmptyStringLiterals(pattern, flags);
			const patternNodeStart = patternArg.getStart(services.sourceFile);

			for (const literal of emptyLiterals) {
				context.report({
					message: "emptyStringLiteral",
					range: {
						begin: patternNodeStart + literal.start,
						end: patternNodeStart + literal.end,
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
