import {
	type AST as RegExpAST,
	visitRegExpAST,
} from "@eslint-community/regexpp";
import {
	getTSNodeRange,
	typescriptLanguage,
} from "@flint.fyi/typescript-language";

import { ruleCreator } from "./ruleCreator.ts";
import { parseRegexpAst } from "./utils/parseRegexpAst.ts";

function getCharacterClassesIfSimplified(pattern: RegExpAST.Pattern) {
	const characterClasses: RegExpAST.CharacterClass[] = [];
	let simplified = false;

	visitRegExpAST(pattern, {
		onCharacterClassEnter(charClass) {
			if (charClass.negate || simplified) {
				return;
			}

			if (hasMatchingCasePair(charClass.elements)) {
				characterClasses.push(charClass);
				simplified = true;
			}
		},
	});

	// May be set by the function inside visitors
	// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
	return simplified ? characterClasses : undefined;
}

function hasMatchingCasePair(elements: RegExpAST.CharacterClassElement[]) {
	const letters = new Set<number>();

	for (const element of elements) {
		if (element.type === "Character" && isLetter(element.value)) {
			letters.add(element.value);
		} else if (element.type === "CharacterClassRange") {
			for (let code = element.min.value; code <= element.max.value; code++) {
				if (isLetter(code)) {
					letters.add(code);
				}
			}
		}
	}

	return letters
		.values()
		.some(
			(letter) =>
				letters.has(toLowerCase(letter)) && letters.has(toUpperCase(letter)),
		);
}

function isLetter(codePoint: number) {
	return (
		(codePoint >= 0x41 && codePoint <= 0x5a) ||
		(codePoint >= 0x61 && codePoint <= 0x7a)
	);
}

function toLowerCase(codePoint: number) {
	return codePoint >= 0x41 && codePoint <= 0x5a ? codePoint + 0x20 : codePoint;
}

function toUpperCase(codePoint: number) {
	return codePoint >= 0x61 && codePoint <= 0x7a ? codePoint - 0x20 : codePoint;
}

export default ruleCreator.createRule(typescriptLanguage, {
	about: {
		description:
			"Reports regex patterns that can be simplified by using the i (ignore case) flag.",
		id: "regexIgnoreCaseFlags",
		presets: ["logical"],
	},
	messages: {
		useIgnoreCase: {
			primary: "This character class can be simplified by using the `i` flag.",
			secondary: [
				"The `i` flag makes the regex case-insensitive, eliminating the need to match both upper and lower case letters explicitly.",
			],
			suggestions: [
				"Add the `i` flag and simplify the character class if it is meant to be case-insensitive.",
				"Remove the `i` flag if it is not meant to be case-insensitive.",
			],
		},
	},
	setup(context) {
		return {
			visitors: {
				RegularExpressionLiteral: (node, { sourceFile }) => {
					const text = node.getText(sourceFile);
					const match = /^\/(.+)\/([dgimsuyv]*)$/.exec(text);
					if (!match) {
						return;
					}

					const [, pattern, flags] = match;
					if (!pattern || flags?.includes("i")) {
						return;
					}

					const regexpAst = parseRegexpAst(pattern, flags);
					if (!regexpAst) {
						return;
					}

					const characterClasses = getCharacterClassesIfSimplified(regexpAst);
					if (!characterClasses) {
						return;
					}

					const nodeRange = getTSNodeRange(node, sourceFile);

					for (const charClass of characterClasses) {
						context.report({
							message: "useIgnoreCase",
							range: {
								begin: nodeRange.begin + 1 + charClass.start,
								end: nodeRange.begin + 1 + charClass.end,
							},
						});
					}
				},
			},
		};
	},
});
