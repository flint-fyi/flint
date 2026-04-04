import {
	getTSNodeRange,
	typescriptLanguage,
} from "@flint.fyi/typescript-language";
import * as ts from "typescript";

import { ruleCreator } from "./ruleCreator.ts";

const REGEX_METACHARACTERS = /[+[{(.?*|\\]/;

function escapeString(str: string): string {
	return str.replace(/["'\\]/g, "\\$&");
}

function isSimpleString(pattern: string): boolean {
	return !REGEX_METACHARACTERS.test(pattern);
}

export default ruleCreator.createRule(typescriptLanguage, {
	about: {
		description:
			"Reports regex patterns that can be replaced with `endsWith` or `startsWith`.",
		id: "stringStartsEndsWith",
		presets: ["stylistic"],
	},
	messages: {
		preferEndsWith: {
			primary: "Prefer `endsWith()` over a regex with `$` for readability.",
			secondary: [
				"`endsWith` is generally more readable than using a regular expression.",
			],
			suggestions: ["Replace the regular expression with `endsWith()`."],
		},
		preferStartsWith: {
			primary: "Prefer `startsWith()` over a regex with `^` for readability.",
			secondary: [
				"`startsWith` is generally more readable than using a regular expression.",
			],
			suggestions: ["Replace the regular expression with `startsWith()`."],
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
					const match = /^\/(.*)\/([gimsuy]*)$/.exec(regexText);
					if (!match) {
						return;
					}

					// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
					const pattern = match[1]!;
					// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
					const flags = match[2]!;

					if (flags.includes("i") || flags.includes("m")) {
						return;
					}

					const argument = node.arguments[0];
					if (!argument) {
						return;
					}

					const argumentText = argument.getText(sourceFile);
					const callRange = getTSNodeRange(node, sourceFile);

					if (pattern.startsWith("^") && !pattern.endsWith("$")) {
						const stringPart = pattern.slice(1);
						if (isSimpleString(stringPart)) {
							context.report({
								fix: {
									range: callRange,
									text: `${argumentText}.startsWith("${escapeString(stringPart)}")`,
								},
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
								fix: {
									range: callRange,
									text: `${argumentText}.endsWith("${escapeString(stringPart)}")`,
								},
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
