import { type AST, type Checker, typescriptLanguage } from "@flint.fyi/ts";
import { nullThrows } from "@flint.fyi/utils";
import { SyntaxKind } from "typescript";

import { isDeclaredInNodeTypes } from "./utils/isDeclaredInNodeTypes.ts";

const consoleMethods = new Set([
	"assert",
	"count",
	"countReset",
	"debug",
	"dir",
	"dirxml",
	"error",
	"group",
	"groupCollapsed",
	"info",
	"log",
	"table",
	"time",
	"timeEnd",
	"timeLog",
	"trace",
	"warn",
]);

function isConsoleMethodCall(node: AST.Expression, typeChecker: Checker) {
	return (
		node.kind == SyntaxKind.PropertyAccessExpression &&
		node.expression.kind == SyntaxKind.Identifier &&
		node.expression.text === "console" &&
		node.name.kind == SyntaxKind.Identifier &&
		consoleMethods.has(node.name.text) &&
		isDeclaredInNodeTypes(node.expression, typeChecker)
	);
}

export default typescriptLanguage.createRule({
	about: {
		description:
			"Disallow leading or trailing spaces in console method string arguments.",
		id: "consoleSpaces",
		preset: "stylistic",
	},
	messages: {
		leading: {
			primary:
				"This leading space is unnecessary as Node.js console outputs already include spaces.",
			secondary: [
				"Leading spaces in console output are often unintentional and can make debugging harder.",
				"Use separate arguments instead, which will be automatically spaced by console methods.",
			],
			suggestions: ["Remove the leading space from the string literal"],
		},
		trailing: {
			primary:
				"This trailing space is unnecessary as Node.js console outputs already include spaces.",
			secondary: [
				"Trailing spaces in console output are often unintentional and can make debugging harder.",
				"Use separate arguments instead, which will be automatically spaced by console methods.",
			],
			suggestions: ["Remove the trailing space from the string literal"],
		},
	},
	setup(context) {
		return {
			visitors: {
				CallExpression(node, { sourceFile, typeChecker }) {
					if (!isConsoleMethodCall(node.expression, typeChecker)) {
						return;
					}

					for (let i = 0; i < node.arguments.length; i++) {
						const argument = nullThrows(
							node.arguments[i],
							"Argument is expected to be present by the loop condition",
						);
						if (
							argument.kind != SyntaxKind.StringLiteral ||
							argument.text.length === 0
						) {
							continue;
						}

						const startSpaces = /^(\s+)/.exec(argument.text);
						if (startSpaces && i !== 0) {
							const start = argument.getStart(sourceFile);
							context.report({
								message: "leading",
								range: {
									begin: start + 1,
									end:
										start +
										nullThrows(
											startSpaces[1],
											"Start spaces is expected to be present by the regex match",
										).length +
										1,
								},
							});
						}

						const endSpaces = /(\s+)$/.exec(argument.text);
						if (endSpaces) {
							const end = node.getEnd();
							context.report({
								message: "trailing",
								range: {
									begin:
										end -
										nullThrows(
											endSpaces[1],
											"End spaces is expected to be present by the regex match",
										).length -
										2,
									end: end - 2,
								},
							});
						}
					}
				},
			},
		};
	},
});
