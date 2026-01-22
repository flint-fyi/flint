import {
	type AST,
	type TypeScriptFileServices,
	typescriptLanguage,
} from "@flint.fyi/typescript-language";
import * as ts from "typescript";

import { ruleCreator } from "./ruleCreator.ts";

interface AssertionInfo {
	assertionRaw: string;
	elementRaw: string;
	end: number;
	start: number;
	type: "alwaysEnter" | "cannotEnter";
}

const wordChars = /^\w$/;

function findContradictions(
	pattern: string,
	doubleEscaped: boolean,
): AssertionInfo[] {
	const contradictions: AssertionInfo[] = [];
	// In a string literal source, \b is represented as \\b (backslash is escaped)
	// In a regex literal source, \b is just \b
	const wordBoundaryRegex = doubleEscaped ? /\\\\b/g : /\\b/g;

	let match: null | RegExpExecArray;
	while ((match = wordBoundaryRegex.exec(pattern)) !== null) {
		const assertionStart = match.index;
		const assertionEnd = match.index + match[0].length;

		const charBefore = getCharBeforeAssertion(
			pattern,
			assertionStart,
			doubleEscaped,
		);

		if (!charBefore) {
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

		const beforeIsWord = isWordChar(charBefore);
		const elementChar = getElementChar(optional.element, doubleEscaped);
		const elementIsWord = isWordChar(elementChar);

		const afterOptional = getCharRepresentation(
			pattern,
			optional.end,
			doubleEscaped,
		);
		if (!afterOptional) {
			continue;
		}

		const afterIsWord = isWordChar(afterOptional.char);

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

function getCharBeforeAssertion(
	pattern: string,
	assertionStart: number,
	doubleEscaped: boolean,
): string | undefined {
	if (assertionStart <= 0) {
		return undefined;
	}

	if (doubleEscaped) {
		if (assertionStart >= 3 && pattern[assertionStart - 3] === "\\") {
			const seq = pattern.slice(assertionStart - 3, assertionStart);
			const charResult = getCharFromEscape(seq);
			if (charResult) {
				return charResult;
			}

			return pattern[assertionStart - 1];
		}

		return pattern[assertionStart - 1];
	}

	if (assertionStart >= 2 && pattern[assertionStart - 2] === "\\") {
		const seq = pattern.slice(assertionStart - 2, assertionStart);
		const charResult = getCharFromEscape(seq);
		if (charResult) {
			return charResult;
		}

		return pattern[assertionStart - 1];
	}

	return pattern[assertionStart - 1];
}

function getCharFromEscape(escape: string): string | undefined {
	if (escape === "\\w" || escape === "\\\\w") {
		return "a";
	}

	if (escape === "\\W" || escape === "\\\\W") {
		return " ";
	}

	if (escape === "\\d" || escape === "\\\\d") {
		return "0";
	}

	if (escape === "\\D" || escape === "\\\\D") {
		return " ";
	}

	if (escape === "\\s" || escape === "\\\\s") {
		return " ";
	}

	if (escape === "\\S" || escape === "\\\\S") {
		return "a";
	}

	return undefined;
}

function getCharRepresentation(
	pattern: string,
	startIndex: number,
	doubleEscaped: boolean,
): undefined | { char: string; length: number } {
	if (startIndex >= pattern.length) {
		return undefined;
	}

	const remaining = pattern.slice(startIndex);

	if (doubleEscaped) {
		if (remaining.startsWith("\\\\")) {
			const twoCharEscape = remaining.slice(0, 3);
			const charResult = getCharFromEscape(twoCharEscape);
			if (charResult) {
				return { char: charResult, length: 3 };
			}

			if (remaining.length >= 3 && remaining[2]) {
				return { char: remaining[2], length: 3 };
			}

			return undefined;
		}
	} else {
		if (remaining.startsWith("\\")) {
			const twoCharEscape = remaining.slice(0, 2);
			const charResult = getCharFromEscape(twoCharEscape);
			if (charResult) {
				return { char: charResult, length: 2 };
			}

			if (
				twoCharEscape === "\\b" ||
				twoCharEscape === "\\B" ||
				twoCharEscape === "\\0"
			) {
				return undefined;
			}

			if (remaining.length >= 2 && remaining[1]) {
				return { char: remaining[1], length: 2 };
			}

			return undefined;
		}
	}

	const char = remaining[0];
	if (!char) {
		return undefined;
	}

	return { char, length: 1 };
}

function getElementChar(
	element: string,
	doubleEscaped: boolean,
): string | undefined {
	if (element.startsWith("[")) {
		const inner = element.slice(1, element.lastIndexOf("]"));
		if (inner.length === 0) {
			return undefined;
		}

		if (inner.startsWith("^")) {
			return undefined;
		}

		if (inner.includes("-") && inner.length > 1) {
			const rangeMatch = /^(.)/.exec(inner);
			if (rangeMatch) {
				return rangeMatch[1];
			}
		}

		const firstChar = inner[0];
		return firstChar;
	}

	const withoutQuantifier = element.replace(/[*?]$/, "");

	if (doubleEscaped && withoutQuantifier.startsWith("\\\\")) {
		const charResult = getCharFromEscape(withoutQuantifier);
		if (charResult) {
			return charResult;
		}

		if (withoutQuantifier.length >= 3) {
			return withoutQuantifier[2];
		}

		return undefined;
	}

	if (!doubleEscaped && withoutQuantifier.startsWith("\\")) {
		const charResult = getCharFromEscape(withoutQuantifier);
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
	const text = node.text;
	const lastSlash = text.lastIndexOf("/");
	return text.slice(1, lastSlash);
}

function isWordChar(char: string | undefined) {
	if (!char) {
		return false;
	}

	return wordChars.test(char);
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

	const charClassMatch = /^\[[^\]]*\][*?]/.exec(remaining);
	if (charClassMatch) {
		return {
			element: charClassMatch[0],
			end: startIndex + charClassMatch[0].length,
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

			const firstArg = args[0];
			if (!firstArg || firstArg.kind !== ts.SyntaxKind.StringLiteral) {
				return;
			}

			const stringLiteral = firstArg;
			const rawText = stringLiteral.getText(services.sourceFile);
			const pattern = rawText.slice(1, -1);
			const contradictions = findContradictions(pattern, true);

			const nodeStart = firstArg.getStart(services.sourceFile);

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

		return {
			visitors: {
				CallExpression: checkRegExpConstructor,
				NewExpression: checkRegExpConstructor,
				RegularExpressionLiteral: checkRegexLiteral,
			},
		};
	},
});
