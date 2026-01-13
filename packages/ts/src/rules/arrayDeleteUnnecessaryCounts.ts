import * as ts from "typescript";

import { getTSNodeRange } from "../getTSNodeRange.ts";
import type { AST } from "../index.ts";
import { typescriptLanguage } from "../language.ts";
import { hasSameTokens } from "../utils/hasSameTokens.ts";
import { unwrapParenthesizedExpression } from "../utils/unwrapParenthesizedExpression.ts";
import { getConstrainedTypeAtLocation } from "./utils/getConstrainedType.ts";

function isUnnecessaryCountArgument(
	argumentRoot: AST.Expression,
	calleeObject: AST.Expression,
	sourceFile: ts.SourceFile,
) {
	const argument = unwrapParenthesizedExpression(argumentRoot);

	switch (argument.kind) {
		case ts.SyntaxKind.Identifier:
			return argument.text === "Infinity" ? "`Infinity`" : undefined;

		case ts.SyntaxKind.PropertyAccessExpression:
			if (
				ts.isIdentifier(argument.expression) &&
				argument.expression.text === "Number" &&
				ts.isIdentifier(argument.name) &&
				argument.name.text === "POSITIVE_INFINITY"
			) {
				return "`Number.POSITIVE_INFINITY`";
			}

			if (
				ts.isIdentifier(argument.name) &&
				argument.name.text === "length" &&
				hasSameTokens(argument.expression, calleeObject, sourceFile)
			) {
				const objectText = ts.isIdentifier(calleeObject)
					? calleeObject.text
					: "…";
				const optionalChain = argument.questionDotToken ? "?." : ".";
				return `\`${objectText}${optionalChain}length\``;
			}
	}

	return undefined;
}

export default typescriptLanguage.createRule({
	about: {
		description:
			"Reports using `.length` or `Infinity` as the `deleteCount` or `skipCount` argument of `Array#splice()` or `Array#toSpliced()`.",
		id: "arrayDeleteUnnecessaryCounts",
		preset: "stylistic",
	},
	messages: {
		unnecessaryCount: {
			primary:
				"Passing {{ description }} as the {{ argumentName }} argument is unnecessary.",
			secondary: [
				"When calling `splice` or `toSpliced`, omitting the second argument will delete or skip all elements after the start index.",
				"Using `.length` or `Infinity` is redundant and makes the code less clear.",
			],
			suggestions: ["Omit the second argument to achieve the same result."],
		},
	},
	setup(context) {
		return {
			visitors: {
				CallExpression: (node, { sourceFile, typeChecker }) => {
					if (
						!ts.isPropertyAccessExpression(node.expression) ||
						!ts.isIdentifier(node.expression.name)
					) {
						return;
					}

					const methodName = node.expression.name.text;
					if (methodName !== "splice" && methodName !== "toSpliced") {
						return;
					}

					if (
						!typeChecker.isArrayType(
							getConstrainedTypeAtLocation(
								node.expression.expression,
								typeChecker,
							),
						)
					) {
						return;
					}

					if (node.arguments.length !== 2) {
						return;
					}

					// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
					const firstArg = node.arguments[0]!;
					if (ts.isSpreadElement(firstArg)) {
						return;
					}

					// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
					const secondArg = node.arguments[1]!;
					if (ts.isSpreadElement(secondArg)) {
						return;
					}

					const description = isUnnecessaryCountArgument(
						secondArg,
						node.expression.expression,
						sourceFile,
					);

					if (!description) {
						return;
					}

					const argumentName =
						methodName === "splice" ? "`deleteCount`" : "`skipCount`";

					context.report({
						data: { argumentName, description },
						message: "unnecessaryCount",
						range: getTSNodeRange(secondArg, sourceFile),
					});
				},
			},
		};
	},
});
