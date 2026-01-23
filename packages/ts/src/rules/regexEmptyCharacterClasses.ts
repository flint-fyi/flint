import { parseRegExpLiteral, visitRegExpAST } from "@eslint-community/regexpp";
import type {
	CharacterClass,
	RegExpLiteral,
} from "@eslint-community/regexpp/ast";
import {
	type AST,
	type TypeScriptFileServices,
	typescriptLanguage,
} from "@flint.fyi/typescript-language";
import * as ts from "typescript";

import { ruleCreator } from "./ruleCreator.ts";

interface EmptyCharacterClass {
	end: number;
	start: number;
}

function characterClassIsEmpty(node: CharacterClass): boolean {
	if (node.negate) {
		return false;
	}

	return node.elements.length === 0;
}

function findEmptyCharacterClasses(
	pattern: string,
	flags: string,
): EmptyCharacterClass[] {
	const results: EmptyCharacterClass[] = [];

	let ast: RegExpLiteral;
	try {
		ast = parseRegExpLiteral(new RegExp(pattern, flags));
	} catch {
		return results;
	}

	visitRegExpAST(ast, {
		onCharacterClassEnter(node: CharacterClass) {
			if (characterClassIsEmpty(node)) {
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
		description: "Reports character classes that match no characters.",
		id: "regexEmptyCharacterClasses",
		presets: ["logical"],
	},
	messages: {
		empty: {
			primary:
				"This character class matches no characters because it is empty.",
			secondary: [
				"An empty character class `[]` never matches anything.",
				"This often indicates a mistake in the regular expression.",
			],
			suggestions: ["Add characters to the class or remove it if unintended."],
		},
	},
	setup(context) {
		function checkRegexLiteral(
			node: AST.RegularExpressionLiteral,
			services: TypeScriptFileServices,
		) {
			const { flags, pattern } = getRegexInfo(node);
			const emptyClasses = findEmptyCharacterClasses(pattern, flags);
			const nodeStart = node.getStart(services.sourceFile);

			for (const charClass of emptyClasses) {
				context.report({
					message: "empty",
					range: {
						begin: nodeStart + charClass.start,
						end: nodeStart + charClass.end,
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

			const emptyClasses = findEmptyCharacterClasses(pattern, flags);
			const patternNodeStart = patternArg.getStart(services.sourceFile);

			for (const charClass of emptyClasses) {
				context.report({
					message: "empty",
					range: {
						begin: patternNodeStart + charClass.start,
						end: patternNodeStart + charClass.end,
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
