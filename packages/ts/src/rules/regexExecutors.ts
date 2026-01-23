import {
	type AST,
	getTSNodeRange,
	typescriptLanguage,
} from "@flint.fyi/typescript-language";
import ts from "typescript";

import { ruleCreator } from "./ruleCreator.ts";
import { getConstrainedTypeAtLocation } from "./utils/getConstrainedType.ts";

// TODO: Use a util like getStaticValue
// https://github.com/flint-fyi/flint/issues/1298
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

				// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
				const flagsArg = node.arguments[1]!;

				if (ts.isStringLiteral(flagsArg)) {
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
				"For consistency, prefer `RegExp.prototype.exec()` over `String.prototype.match()` when not using the global flag.",
			secondary: [
				"`RegExp.prototype.exec()` is functionally identical to and slightly fewer characters than `String.prototype.match()` when the regex has no global flag.",
				"Choosing one by default leads to more consistent and therefore more readable code.",
			],
			suggestions: [
				"Switch from `String.prototype.match()` to `RegExp.prototype.exec()`.",
				"Add the global flag to the regular expression.",
			],
		},
	},
	setup(context) {
		return {
			visitors: {
				CallExpression: (node, { sourceFile, typeChecker }) => {
					if (
						!ts.isPropertyAccessExpression(node.expression) ||
						node.expression.name.text !== "match" ||
						node.arguments.length < 1 ||
						!(
							getConstrainedTypeAtLocation(
								node.expression.expression,
								typeChecker,
							).flags & ts.TypeFlags.StringLike
						)
					) {
						return;
					}

					// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
					const firstArgument = node.arguments[0]!;

					const objectType = typeChecker.getTypeAtLocation(
						node.expression.expression,
					);
					if (!(objectType.flags & ts.TypeFlags.StringLike)) {
						return;
					}

					const flags = getRegexFlags(firstArgument, sourceFile);
					if (flags === undefined || flags.includes("g")) {
						return;
					}

					const range = getTSNodeRange(node, sourceFile);
					const regexText = firstArgument.getText(sourceFile);

					context.report({
						fix: {
							range,
							text: `${regexText}.exec(${node.expression.expression.getText(sourceFile)})`,
						},
						message: "preferExec",
						range,
					});
				},
			},
		};
	},
});
