import {
	type AST,
	getTSNodeRange,
	typescriptLanguage,
} from "@flint.fyi/typescript-language";
import ts from "typescript";

import { ruleCreator } from "./ruleCreator.ts";

function getRegexFlags(node: AST.Expression, sourceFile: AST.SourceFile) {
	switch (node.kind) {
		case ts.SyntaxKind.CallExpression:
		case ts.SyntaxKind.NewExpression:
			if (
				ts.isIdentifier(node.expression) &&
				node.expression.text === "RegExp" &&
				node.arguments
			) {
				if (node.arguments.length < 2) {
					return "";
				}

				const flagsArg = node.arguments[1];

				if (flagsArg && ts.isStringLiteral(flagsArg)) {
					return flagsArg.text;
				}
			}

			return undefined;

		case ts.SyntaxKind.RegularExpressionLiteral: {
			const text = node.getText(sourceFile);
			const lastSlash = text.lastIndexOf("/");
			return lastSlash >= 0 ? text.slice(lastSlash + 1) : "";
		}

		default:
			return undefined;
	}
}

export default ruleCreator.createRule(typescriptLanguage, {
	about: {
		description:
			"Reports String.prototype.match calls that can be replaced with RegExp.prototype.exec.",
		id: "regexExecutors",
		presets: ["stylisticStrict"],
	},
	messages: {
		preferExec: {
			primary:
				"Prefer `RegExp.prototype.exec()` over `String.prototype.match()` when not using the global flag.",
			secondary: [
				"`RegExp.prototype.exec()` is functionally identical to `String.prototype.match()` when the regex has no global flag, but may be slightly more efficient.",
			],
			suggestions: [],
		},
	},
	setup(context) {
		return {
			visitors: {
				CallExpression: (node, { sourceFile, typeChecker }) => {
					if (!ts.isPropertyAccessExpression(node.expression)) {
						return;
					}

					const methodName = node.expression.name.text;
					if (methodName !== "match") {
						return;
					}

					if (node.arguments.length < 1) {
						return;
					}

					const firstArg = node.arguments[0];
					if (!firstArg) {
						return;
					}

					const objectType = typeChecker.getTypeAtLocation(
						node.expression.expression,
					);
					if (!(objectType.flags & ts.TypeFlags.StringLike)) {
						return;
					}

					const flags = getRegexFlags(firstArg, sourceFile);
					if (flags === undefined) {
						return;
					}

					if (flags.includes("g")) {
						return;
					}

					context.report({
						message: "preferExec",
						range: getTSNodeRange(node, sourceFile),
					});
				},
			},
		};
	},
});
