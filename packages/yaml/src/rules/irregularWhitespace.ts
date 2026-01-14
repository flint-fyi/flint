import { yamlLanguage } from "../language.ts";
import { ruleCreator } from "./ruleCreator.ts";

const IRREGULAR_WHITESPACE =
	/[\v\f\u0085\u00a0\u1680\u180e\u2000-\u200b\u202f\u205f\u3000\ufeff]/gu;
const IRREGULAR_LINE_TERMINATORS = /[\u2028\u2029]/gu;

export default ruleCreator.createRule(yamlLanguage, {
	about: {
		description: "Reports irregular whitespace characters.",
		id: "irregularWhitespace",
		presets: ["logical"],
	},
	messages: {
		irregularWhitespace: {
			primary: "Irregular whitespace character found.",
			secondary: [
				"Irregular whitespace characters like non-breaking spaces or zero-width spaces can cause parsing issues or debugging difficulties.",
				"These characters are often invisible and can be accidentally introduced when copying text from other sources.",
			],
			suggestions: ["Replace the irregular whitespace with a regular space."],
		},
	},
	setup(context) {
		return {
			visitors: {
				root: (node, { sourceText }) => {
					let match;

					while ((match = IRREGULAR_WHITESPACE.exec(sourceText)) !== null) {
						context.report({
							message: "irregularWhitespace",
							range: {
								begin: match.index,
								end: match.index + match[0].length,
							},
						});
					}

					while (
						(match = IRREGULAR_LINE_TERMINATORS.exec(sourceText)) !== null
					) {
						context.report({
							message: "irregularWhitespace",
							range: {
								begin: match.index,
								end: match.index + match[0].length,
							},
						});
					}
				},
			},
		};
	},
});
