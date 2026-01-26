import { typescriptLanguage } from "@flint.fyi/typescript-language";
import * as ts from "typescript";

import { ruleCreator } from "./ruleCreator.ts";

const REGEX_METACHARACTERS = /[+[{(.?*|\\]/;

function isSimpleString(pattern: string): boolean {
	return !REGEX_METACHARACTERS.test(pattern);
}

export default ruleCreator.createRule(typescriptLanguage, {
	about: {
		description:
			"Reports regex patterns that can be replaced with startsWith or endsWith.",
		id: "stringStartsEndsWith",
		presets: ["logical"],
	},
	messages: {
		preferStartsWith: {
			primary: "Prefer `startsWith()` over a regex with `^`.",
			secondary: [
				"startsWith is more readable and performs better than regex.",
			],
			suggestions: ["Replace with startsWith()."],
		},
		preferEndsWith: {
			primary: "Prefer `endsWith()` over a regex with `$`.",
			secondary: ["endsWith is more readable and performs better than regex."],
			suggestions: ["Replace with endsWith()."],
		},
	},
	setup(context) {
		return {
			visitors: {
				CallExpression(node, { sourceFile }) {
					if (!ts.isPropertyAccessExpression(node.expression)) {
						return;
					}

					if (node.expression.name.text !== "test") {
						return;
					}

					const callee = node.expression.expression;
					if (!ts.isRegularExpressionLiteral(callee)) {
						return;
					}

					const regexText = callee.text;
					const match = regexText.match(/^\/(.*)\/([gimsuy]*)$/);
					if (!match) {
						return;
					}

					const [, pattern, flags] = match;

					if (flags.includes("i") || flags.includes("m")) {
						return;
					}

					if (pattern.startsWith("^") && !pattern.endsWith("$")) {
						const stringPart = pattern.slice(1);
						if (isSimpleString(stringPart)) {
							context.report({
								message: "preferStartsWith",
								range: {
									begin: callee.getStart(sourceFile),
									end: callee.getEnd(),
								},
							});
						}
					} else if (pattern.endsWith("$") && !pattern.startsWith("^")) {
						const stringPart = pattern.slice(0, -1);
						if (isSimpleString(stringPart)) {
							context.report({
								message: "preferEndsWith",
								range: {
									begin: callee.getStart(sourceFile),
									end: callee.getEnd(),
								},
							});
						}
					}
				},
			},
		};
	},
});
