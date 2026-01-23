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
			"Reports string literals inside character classes with the v flag that contain multiple graphemes.",
		id: "regexGraphemeStringLiterals",
		presets: ["logicalStrict"],
	},
	messages: {
		multipleGraphemes: {
			primary:
				"Only single characters and graphemes are allowed inside character class string literals. Use regular alternatives (e.g. '{{ alternative }}') for strings instead.",
			secondary: [
				"String literals in character classes should represent single graphemes, not multi-character strings.",
			],
			suggestions: [
				"Replace with alternation using a non-capturing group: '{{ alternative }}'.",
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

					const [, pattern, flagsStr] = match;

					if (!pattern || !flagsStr?.includes("v")) {
						return;
					}

					const regexpAst = parseRegexpAst(pattern, {
						unicodeSets: true,
					});

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
