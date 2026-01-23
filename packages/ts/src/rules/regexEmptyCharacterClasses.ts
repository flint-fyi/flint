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

import { ruleCreator } from "./ruleCreator.ts";
import { getRegExpConstruction } from "./utils/getRegExpConstruction.ts";

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
			suggestions: [
				"Add characters to the class if it's meant to capture any.",
				"Remove the class if it is unintended.",
			],
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
			const construction = getRegExpConstruction(node, services);
			if (!construction) {
				return;
			}

			const patternEscaped = construction.pattern.replace(/\\\\/g, "\\");
			const emptyClasses = findEmptyCharacterClasses(
				patternEscaped,
				construction.flags,
			);

			for (const charClass of emptyClasses) {
				context.report({
					message: "empty",
					range: {
						begin: construction.start + charClass.start,
						end: construction.start + charClass.end,
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
