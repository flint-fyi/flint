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

const segmenter = new Intl.Segmenter();

function buildAlternativeExample(
	stringAlternative: RegExpAST.StringAlternative,
) {
	const alternativeRaws = stringAlternative.parent.alternatives
		.filter(isMultipleGraphemes)
		.map((alternative) => alternative.raw);

	return `(?:${alternativeRaws.join("|")}|[...])`;
}

function isMultipleGraphemes(stringAlternative: RegExpAST.StringAlternative) {
	if (stringAlternative.elements.length <= 1) {
		return false;
	}

	const string = String.fromCodePoint(
		...stringAlternative.elements.map((element) => element.value),
	);
	const segments = [...segmenter.segment(string)];

	return segments.length > 1;
}

export default ruleCreator.createRule(typescriptLanguage, {
	about: {
		description:
			"Reports string literals inside character classes with the `v` flag that contain multiple graphemes.",
		id: "regexGraphemeStringLiterals",
		presets: ["stylisticStrict"],
	},
	messages: {
		multipleGraphemes: {
			primary:
				"This literal contains multiple graphemes in the `\\q{}` matcher intended for single graphemes.",
			secondary: [
				"The `\\q{}` syntax is designed for single extended grapheme clusters like emoji sequences.",
				'Using it for multiple "graphemes" (visual characters) is often a mistake.',
			],
			suggestions: [
				"If matching multi-character strings, consider using alternation: '{{ alternative }}'.",
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

					if (!pattern || !flags?.includes("v")) {
						return;
					}

					const regexpAst = parseRegexpAst(pattern, flags);
					if (!regexpAst) {
						return;
					}

					const nodeRange = getTSNodeRange(node, sourceFile);

					visitRegExpAST(regexpAst, {
						onStringAlternativeEnter(stringAlternative) {
							if (!isMultipleGraphemes(stringAlternative)) {
								return;
							}

							const alternative = buildAlternativeExample(stringAlternative);

							context.report({
								data: { alternative },
								message: "multipleGraphemes",
								range: nodeRange,
							});
						},
					});
				},
			},
		};
	},
});
