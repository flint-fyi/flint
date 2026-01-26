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

function findUnnecessaryCharacterClasses(pattern: string, flags: string) {
	const results: CharacterClass[] = [];

	let ast: RegExpLiteral;
	try {
		ast = parseRegExpLiteral(new RegExp(pattern, flags));
	} catch {
		return results;
	}

	visitRegExpAST(ast, {
		onCharacterClassEnter(node: CharacterClass) {
			if (canUnwrapSingleElement(node)) {
				results.push(node);
			}
		},
	});

	return results;
}

function canUnwrapSingleElement(characterClass: CharacterClass) {
	if (characterClass.negate) {
		return false;
	}

	if (characterClass.elements.length !== 1) {
		return false;
	}

	const element = characterClass.elements[0];
	if (!element) {
		return false;
	}

	if (element.type === "CharacterClassRange") {
		return false;
	}

	if (element.type === "Character") {
		if (element.raw === "=") {
			return false;
		}

		if (element.raw === "\\b") {
			return false;
		}

		if (/^\\[1-9]\d*$/.test(element.raw)) {
			return false;
		}
	}

	return true;
}

export default ruleCreator.createRule(typescriptLanguage, {
	about: {
		description:
			"Reports character classes that wrap a single element that does not require brackets.",
		id: "regexUnnecessaryCharacterClasses",
		presets: ["logical"],
	},
	messages: {
		unnecessary: {
			primary:
				"This character class wraps a single element that does not require brackets.",
			secondary: [
				"Single-element character classes can be simplified by removing the brackets.",
			],
			suggestions: [
				"Remove the surrounding brackets from this character class.",
			],
		},
	},
	setup(context) {
		function checkRegexLiteral(
			node: AST.RegularExpressionLiteral,
			services: TypeScriptFileServices,
		) {
			const { flags, pattern, start } = getRegExpLiteralDetails(node, services);
			const unnecessaryClasses = findUnnecessaryCharacterClasses(
				pattern,
				flags,
			);

			for (const characterClass of unnecessaryClasses) {
				context.report({
					message: "unnecessary",
					range: {
						begin: start + characterClass.start - 1,
						end: start + characterClass.end - 1,
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
			const unnecessaryClasses = findUnnecessaryCharacterClasses(
				patternEscaped,
				construction.flags,
			);

			for (const characterClass of unnecessaryClasses) {
				context.report({
					message: "unnecessary",
					range: {
						begin: construction.start + characterClass.start,
						end: construction.start + characterClass.end,
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
