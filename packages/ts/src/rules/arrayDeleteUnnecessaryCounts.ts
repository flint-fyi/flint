import { SyntaxKind } from "typescript";

import {
	getTSNodeRange,
	hasSameTokens,
	typescriptLanguage,
	unwrapParenthesizedNode,
	type AST,
} from "@flint.fyi/typescript-language";

import { ruleCreator } from "./ruleCreator.ts";
import { getConstrainedTypeAtLocation } from "./utils/getConstrainedType.ts";

function isUnnecessaryCountArgument(
	argumentRoot: AST.Expression,
	calleeObject: AST.Expression,
	sourceFile: AST.SourceFile,
) {
	const argument = unwrapParenthesizedNode(argumentRoot);

	switch (argument.kind) {
		case SyntaxKind.Identifier:
			return argument.text === "Infinity" ? "`Infinity`" : undefined;

		case SyntaxKind.PropertyAccessExpression:
			if (
				argument.expression.kind === SyntaxKind.Identifier &&
				argument.expression.text === "Number" &&
				argument.name.kind === SyntaxKind.Identifier &&
				argument.name.text === "POSITIVE_INFINITY"
			) {
				return "`Number.POSITIVE_INFINITY`";
			}

			if (
				argument.name.kind === SyntaxKind.Identifier &&
				argument.name.text === "length" &&
				hasSameTokens(argument.expression, calleeObject, sourceFile)
			) {
				const objectText =
					calleeObject.kind === SyntaxKind.Identifier ? calleeObject.text : "…";
				const optionalChain = argument.questionDotToken ? "?." : ".";
				return `\`${objectText}${optionalChain}length\``;
			}
	}

	return undefined;
}

export default ruleCreator.createRule(typescriptLanguage, {
	about: {
		description:
			"Reports using `.length` or `Infinity` as the `deleteCount` or `skipCount` argument of `Array#splice()` or `Array#toSpliced()`.",
		id: "arrayDeleteUnnecessaryCounts",
		presets: ["stylistic", "stylisticStrict"],
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
						node.expression.kind !== SyntaxKind.PropertyAccessExpression ||
						node.expression.name.kind !== SyntaxKind.Identifier
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
					if (firstArg.kind === SyntaxKind.SpreadElement) {
						return;
					}

					// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
					const secondArg = node.arguments[1]!;
					if (secondArg.kind === SyntaxKind.SpreadElement) {
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
