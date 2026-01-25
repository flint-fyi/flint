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
import { getRegExpLiteralDetails } from "./utils/getRegExpLiteralDetails.ts";

function characterClassIsEmpty(node: CharacterClass) {
	return !node.negate && node.elements.length === 0;
}

function findEmptyCharacterClasses(pattern: string, flags: string) {
	const results: CharacterClass[] = [];

	let ast: RegExpLiteral;
	try {
		ast = parseRegExpLiteral(new RegExp(pattern, flags));
	} catch {
		return results;
	}

	visitRegExpAST(ast, {
		onCharacterClassEnter(node: CharacterClass) {
			if (characterClassIsEmpty(node)) {
				results.push(node);
			}
		},
	});

	return results;
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
			const { flags, pattern, start } = getRegExpLiteralDetails(node, services);
			const emptyClasses = findEmptyCharacterClasses(pattern, flags);

			for (const charClass of emptyClasses) {
				context.report({
					message: "empty",
					range: {
						begin: start + charClass.start - 1,
						end: start + charClass.end - 1,
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
