import {
	type AST as RegExpAST,
	RegExpParser,
	visitRegExpAST,
} from "@eslint-community/regexpp";
import {
	getTSNodeRange,
	typescriptLanguage,
} from "@flint.fyi/typescript-language";

import { ruleCreator } from "./ruleCreator.ts";

type CharElement =
	| RegExpAST.Character
	| RegExpAST.CharacterClass
	| RegExpAST.CharacterSet
	| RegExpAST.ExpressionCharacterClass;

interface CharLookaround {
	alternatives: [{ elements: [CharElement] }];
	kind: "lookahead" | "lookbehind";
	negate: boolean;
}

function escapeRaw(raw: string) {
	if (/^[&\-^]$/u.test(raw)) {
		return `\\${raw}`;
	}
	return raw;
}

function isCharElement(node: RegExpAST.Node): node is CharElement {
	return (
		node.type === "Character" ||
		node.type === "CharacterSet" ||
		node.type === "CharacterClass" ||
		node.type === "ExpressionCharacterClass"
	);
}

function isCharLookaround(
	node: RegExpAST.Node,
): node is CharLookaround & RegExpAST.LookaroundAssertion {
	if (
		node.type !== "Assertion" ||
		(node.kind !== "lookahead" && node.kind !== "lookbehind")
	) {
		return false;
	}

	const firstAlt = node.alternatives[0];
	if (!firstAlt || node.alternatives.length !== 1) {
		return false;
	}

	const firstElement = firstAlt.elements[0];
	if (!firstElement || firstAlt.elements.length !== 1) {
		return false;
	}

	return isCharElement(firstElement);
}

export default ruleCreator.createRule(typescriptLanguage, {
	about: {
		description:
			"Reports lookarounds that can be replaced with character class set operations.",
		id: "regexCharacterClassSetOperations",
		presets: ["stylistic"],
	},
	messages: {
		preferSetOperation: {
			primary:
				"This lookaround can be combined with '{{ char }}' using a set operation.",
			secondary: [
				"Character class set operations (using the v flag) are more readable and performant than lookarounds.",
			],
			suggestions: [
				"Replace the lookaround with a character class set operation.",
			],
		},
	},
	setup(context) {
		const parser = new RegExpParser();

		return {
			visitors: {
				RegularExpressionLiteral: (node, { sourceFile }) => {
					const text = node.getText(sourceFile);
					const match = /^\/(.+)\/([dgimsuyv]*)$/.exec(text);

					if (!match) {
						return;
					}

					const [, pattern, flagsStr] = match;

					if (!pattern) {
						return;
					}

					const hasUnicodeSets = flagsStr?.includes("v") ?? false;

					if (!hasUnicodeSets) {
						return;
					}

					let regexpAst: RegExpAST.Pattern;
					try {
						regexpAst = parser.parsePattern(pattern, undefined, undefined, {
							unicode: false,
							unicodeSets: true,
						});
					} catch {
						return;
					}

					visitRegExpAST(regexpAst, {
						onAlternativeEnter(alternative) {
							const { elements } = alternative;

							for (let i = 1; i < elements.length; i++) {
								const previous = elements[i - 1];
								const current = elements[i];

								if (!previous || !current) {
									continue;
								}

								if (
									isCharElement(previous) &&
									isCharLookaround(current) &&
									current.kind === "lookbehind"
								) {
									const assertElement = current.alternatives[0].elements[0];
									const operator = current.negate ? "--" : "&&";
									const left = escapeRaw(previous.raw);
									const right = escapeRaw(assertElement.raw);
									const replacement = `[${left}${operator}${right}]`;

									const nodeRange = getTSNodeRange(node, sourceFile);
									context.report({
										data: {
											char: previous.raw,
											replacement,
										},
										message: "preferSetOperation",
										range: nodeRange,
									});
								}

								if (
									isCharLookaround(previous) &&
									previous.kind === "lookahead" &&
									isCharElement(current)
								) {
									const assertElement = previous.alternatives[0].elements[0];
									const operator = previous.negate ? "--" : "&&";
									const left = escapeRaw(current.raw);
									const right = escapeRaw(assertElement.raw);
									const replacement = `[${left}${operator}${right}]`;

									const nodeRange = getTSNodeRange(node, sourceFile);
									context.report({
										data: {
											char: current.raw,
											replacement,
										},
										message: "preferSetOperation",
										range: nodeRange,
									});
								}
							}
						},
					});
				},
			},
		};
	},
});
