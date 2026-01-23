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

function getNegationText(
	node: RegExpAST.CharacterSet | RegExpAST.ExpressionCharacterClass,
) {
	if (node.type === "ExpressionCharacterClass") {
		return `[${node.raw.slice(2, -1)}]`;
	}

	const kind = node.raw[1];
	if (!kind) {
		return undefined;
	}

	const newKind =
		kind.toLowerCase() === kind ? kind.toUpperCase() : kind.toLowerCase();

	return `\\${newKind}${node.raw.slice(2)}`;
}

export default ruleCreator.createRule(typescriptLanguage, {
	about: {
		description:
			"Reports negated character classes that can use shorthand escapes.",
		id: "regexConciseCharacterClassNegations",
		presets: ["stylistic"],
	},
	messages: {
		preferNegatedEscape: {
			primary: "Use '{{ replacement }}' instead of negated character class.",
			secondary: [
				"Shorthand escape sequences like \\D, \\W, and \\S are more concise than negated character classes.",
			],
			suggestions: [
				"Replace the negated character class with '{{ replacement }}'.",
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

					const hasUnicode = flagsStr?.includes("u") ?? false;
					const hasUnicodeSets = flagsStr?.includes("v") ?? false;
					const hasIgnoreCase = flagsStr?.includes("i") ?? false;

					let regexpAst: RegExpAST.Pattern;
					try {
						regexpAst = parser.parsePattern(pattern, undefined, undefined, {
							unicode: hasUnicode,
							unicodeSets: hasUnicodeSets,
						});
					} catch {
						return;
					}

					visitRegExpAST(regexpAst, {
						onCharacterClassEnter(ccNode) {
							if (!ccNode.negate || ccNode.elements.length !== 1) {
								return;
							}

							// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
							const element = ccNode.elements[0]!;

							if (
								element.type !== "CharacterSet" &&
								element.type !== "ExpressionCharacterClass"
							) {
								return;
							}

							if (
								element.type === "CharacterSet" &&
								element.kind === "property" &&
								hasIgnoreCase &&
								!hasUnicodeSets
							) {
								return;
							}

							const replacement = getNegationText(element);
							if (!replacement) {
								return;
							}

							context.report({
								data: { replacement },
								message: "preferNegatedEscape",
								range: getTSNodeRange(node, sourceFile),
							});
						},
					});
				},
			},
		};
	},
});
