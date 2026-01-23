import {
	type AST,
	type TypeScriptFileServices,
	typescriptLanguage,
} from "@flint.fyi/typescript-language";

import { ruleCreator } from "./ruleCreator.ts";
import { getRegExpConstruction } from "./utils/getRegExpConstruction.ts";

interface AssertionInfo {
	assertionRaw: string;
	elementRaw: string;
	end: number;
	start: number;
	type: "alwaysEnter" | "cannotEnter";
}

function findContradictions(pattern: string, doubleEscaped: boolean) {
	const contradictions: AssertionInfo[] = [];
	// In a string literal source, \b is represented as \\b (backslash is escaped)
	// In a regex literal source, \b is just \b
	const wordBoundaryRegex = doubleEscaped ? /\\\\b/g : /\\b/g;

	let match: null | RegExpExecArray;
	while ((match = wordBoundaryRegex.exec(pattern)) !== null) {
		const assertionStart = match.index;
		const assertionEnd = match.index + match[0].length;

		const characterBefore = getCharBeforeAssertion(
			pattern,
			assertionStart,
			doubleEscaped,
		);

		if (!characterBefore) {
			continue;
		}

		const optional = parseOptionalQuantifier(
			pattern,
			assertionEnd,
			doubleEscaped,
		);
		if (!optional) {
			continue;
		}

		const beforeIsWord = isWordCharacter(characterBefore);
		const elementCharacter = getElementChar(optional.element, doubleEscaped);
		const elementIsWord = isWordCharacter(elementCharacter);

		const afterOptional = getCharRepresentation(
			pattern,
			optional.end,
			doubleEscaped,
		);
		if (!afterOptional) {
			continue;
		}

		const afterIsWord = isWordCharacter(afterOptional.character);

		// Word boundary \b requires a transition between word and non-word chars
		// If element has same word-ness as char before \b, entering quantifier would violate \b
		if (beforeIsWord === elementIsWord) {
			contradictions.push({
				assertionRaw: match[0],
				elementRaw: optional.element,
				end: optional.end,
				start: assertionEnd,
				type: "cannotEnter",
			});
		} else if (beforeIsWord === afterIsWord) {
			// If skipping the optional would go from before directly to after,
			// and both have same word-ness, that violates \b, so quantifier is always entered
			contradictions.push({
				assertionRaw: match[0],
				elementRaw: optional.element,
				end: optional.end,
				start: assertionEnd,
				type: "alwaysEnter",
			});
		}
	}

	return contradictions;
}

function getCharacterFromEscape(escape: string) {
	switch (escape) {
		case "\\\\d":
		case "\\d":
			return "0";

		case "\\\\D":
		case "\\D":
			return " ";

		case "\\\\s":
		case "\\s":
			return " ";

		case "\\\\S":
		case "\\S":
			return "a";

		case "\\\\w":
		case "\\w":
			return "a";

		case "\\\\W":
		case "\\W":
			return " ";

		default:
			return undefined;
	}
}

function getCharBeforeAssertion(
	pattern: string,
	assertionStart: number,
	doubleEscaped: boolean,
) {
	if (assertionStart <= 0) {
		return undefined;
	}

	if (doubleEscaped) {
		if (assertionStart >= 3 && pattern[assertionStart - 3] === "\\") {
			const seq = pattern.slice(assertionStart - 3, assertionStart);
			const charResult = getCharacterFromEscape(seq);
			if (charResult) {
				return charResult;
			}

			return pattern[assertionStart - 1];
		}

		return pattern[assertionStart - 1];
	}

	if (assertionStart >= 2 && pattern[assertionStart - 2] === "\\") {
		const seq = pattern.slice(assertionStart - 2, assertionStart);
		const charResult = getCharacterFromEscape(seq);
		if (charResult) {
			return charResult;
		}

		return pattern[assertionStart - 1];
	}

	return pattern[assertionStart - 1];
}

function getCharRepresentation(
	pattern: string,
	startIndex: number,
	doubleEscaped: boolean,
): undefined | { character: string; length: number } {
	if (startIndex >= pattern.length) {
		return undefined;
	}

	const remaining = pattern.slice(startIndex);

	if (doubleEscaped) {
		if (remaining.startsWith("\\\\")) {
			const twoCharEscape = remaining.slice(0, 3);
			const charResult = getCharacterFromEscape(twoCharEscape);
			if (charResult) {
				return { character: charResult, length: 3 };
			}

			if (remaining.length >= 3 && remaining[2]) {
				return { character: remaining[2], length: 3 };
			}

			return undefined;
		}
	} else {
		if (remaining.startsWith("\\")) {
			const twoCharEscape = remaining.slice(0, 2);
			const charResult = getCharacterFromEscape(twoCharEscape);
			if (charResult) {
				return { character: charResult, length: 2 };
			}

			if (
				twoCharEscape === "\\b" ||
				twoCharEscape === "\\B" ||
				twoCharEscape === "\\0" ||
				remaining.length < 1 ||
				!remaining[1]
			) {
				return undefined;
			}

			return { character: remaining[1], length: 2 };
		}
	}

	// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
	const character = remaining[0]!;

	return { character, length: 1 };
}

function getElementChar(element: string, doubleEscaped: boolean) {
	if (element.startsWith("[")) {
		const inner = element.slice(1, element.lastIndexOf("]"));
		if (inner.length === 0 || inner.startsWith("^")) {
			return undefined;
		}

		if (inner.includes("-") && inner.length > 1) {
			const rangeMatch = /^(.)/.exec(inner);
			if (rangeMatch) {
				return rangeMatch[1];
			}
		}

		return inner[0];
	}

	const withoutQuantifier = element.replace(/[*?]$/, "");

	if (doubleEscaped && withoutQuantifier.startsWith("\\\\")) {
		const characterResult = getCharacterFromEscape(withoutQuantifier);
		if (characterResult) {
			return characterResult;
		}

		if (withoutQuantifier.length >= 3) {
			return withoutQuantifier[2];
		}

		return undefined;
	}

	if (!doubleEscaped && withoutQuantifier.startsWith("\\")) {
		const charResult = getCharacterFromEscape(withoutQuantifier);
		if (charResult) {
			return charResult;
		}

		if (withoutQuantifier.length >= 2) {
			return withoutQuantifier[1];
		}

		return undefined;
	}

	return withoutQuantifier;
}

function getRegexPattern(node: AST.RegularExpressionLiteral): string {
	return node.text.slice(1, node.text.lastIndexOf("/"));
}

function isWordCharacter(character: string | undefined) {
	return character ? /^\w$/.test(character) : false;
}

function parseOptionalQuantifier(
	pattern: string,
	startIndex: number,
	doubleEscaped: boolean,
): undefined | { element: string; end: number } {
	if (startIndex >= pattern.length) {
		return undefined;
	}

	const remaining = pattern.slice(startIndex);

	const characterClassMatch = /^\[[^\]]*\][*?]/.exec(remaining);
	if (characterClassMatch) {
		return {
			element: characterClassMatch[0],
			end: startIndex + characterClassMatch[0].length,
		};
	}

	const escapePattern = doubleEscaped ? /^(?:\\\\.|.)[*?]/ : /^(?:\\.|.)[*?]/;
	const simpleMatch = remaining.match(escapePattern);
	if (simpleMatch) {
		return {
			element: simpleMatch[0],
			end: startIndex + simpleMatch[0].length,
		};
	}

	return undefined;
}

export default ruleCreator.createRule(typescriptLanguage, {
	about: {
		description:
			"Reports elements in regular expressions that contradict assertions.",
		id: "regexContradictoryAssertions",
		presets: ["logical"],
	},
	messages: {
		alwaysEnter: {
			primary:
				"The quantifier '{{ element }}' is always entered despite having a minimum of 0.",
			secondary: [
				"The quantifier appears after an assertion that forces it to be matched at least once.",
				"This can lead to unexpected matching behavior.",
			],
			suggestions: ["Change the quantifier minimum to 1."],
		},
		cannotEnter: {
			primary:
				"The quantifier '{{ element }}' can never be entered because it contradicts the assertion '{{ assertion }}'.",
			secondary: [
				"The quantifier element would need to match characters that the assertion explicitly forbids.",
				"This means the quantifier is effectively dead code.",
			],
			suggestions: ["Remove the quantifier or fix the pattern."],
		},
	},
	setup(context) {
		function checkRegexLiteral(
			node: AST.RegularExpressionLiteral,
			{ sourceFile }: TypeScriptFileServices,
		) {
			const pattern = getRegexPattern(node);
			const contradictions = findContradictions(pattern, false);

			const nodeStart = node.getStart(sourceFile);

			for (const contradiction of contradictions) {
				context.report({
					data: {
						assertion: contradiction.assertionRaw,
						element: contradiction.elementRaw,
					},
					message:
						contradiction.type === "alwaysEnter"
							? "alwaysEnter"
							: "cannotEnter",
					range: {
						begin: nodeStart + 1 + contradiction.start,
						end: nodeStart + 1 + contradiction.end,
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

			const contradictions = findContradictions(construction.pattern, true);

			for (const contradiction of contradictions) {
				context.report({
					data: {
						assertion: contradiction.assertionRaw,
						element: contradiction.elementRaw,
					},
					message:
						contradiction.type === "alwaysEnter"
							? "alwaysEnter"
							: "cannotEnter",
					range: {
						begin: construction.start + 1 + contradiction.start,
						end: construction.start + 1 + contradiction.end,
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
