import * as ts from "typescript";

import { getTSNodeRange } from "../getTSNodeRange.ts";
import type { AST } from "../index.ts";
import { typescriptLanguage } from "../language.ts";
import { hasSameTokens } from "../utils/hasSameTokens.ts";

export default typescriptLanguage.createRule({
	about: {
		description:
			"Reports unnecessary `end` argument in `.slice()` calls when it equals the length or is `Infinity`.",
		id: "arraySliceUnnecessaryEnd",
		preset: "stylistic",
	},
	messages: {
		unnecessaryEnd: {
			primary:
				"The `end` argument is unnecessary when slicing to the end of the array or string.",
			secondary: [
				"Passing `.length` or `Infinity` as the `end` argument is unnecessary.",
				"The `.slice()` method defaults to the end when the second argument is omitted.",
			],
			suggestions: ["Remove the unnecessary `end` argument."],
		},
	},
	setup(context) {
		return {
			visitors: {
				CallExpression: (node, { sourceFile }) => {
					if (
						!ts.isPropertyAccessExpression(node.expression) ||
						node.expression.name.text !== "slice" ||
						node.arguments.length !== 2
					) {
						return;
					}

					// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
					const endArgument = node.arguments[1]!;
					if (
						!isUnnecessaryEnd(
							node.expression.expression,
							endArgument,
							sourceFile,
						)
					) {
						return;
					}

					context.report({
						fix: {
							range: {
								// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
								begin: node.arguments[0]!.getEnd(),
								end: endArgument.getEnd(),
							},
							text: "",
						},
						message: "unnecessaryEnd",
						range: getTSNodeRange(endArgument, sourceFile),
					});
				},
			},
		};
	},
});

function isInfinity(node: AST.Expression) {
	switch (node.kind) {
		case ts.SyntaxKind.Identifier:
			return node.text === "Infinity";

		case ts.SyntaxKind.PropertyAccessExpression:
			return (
				ts.isIdentifier(node.expression) &&
				node.expression.text === "Number" &&
				node.name.text === "POSITIVE_INFINITY"
			);

		default:
			return false;
	}
}

function isLengthOfReceiver(
	receiver: AST.Expression,
	endArgument: AST.Expression,
	sourceFile: ts.SourceFile,
) {
	return (
		ts.isPropertyAccessExpression(endArgument) &&
		endArgument.name.text === "length" &&
		hasSameTokens(receiver, endArgument.expression, sourceFile)
	);
}

function isUnnecessaryEnd(
	receiver: AST.Expression,
	endArgument: AST.Expression,
	sourceFile: ts.SourceFile,
) {
	return (
		isInfinity(endArgument) ||
		isLengthOfReceiver(receiver, endArgument, sourceFile)
	);
}
