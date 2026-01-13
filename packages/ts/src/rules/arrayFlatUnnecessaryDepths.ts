import * as ts from "typescript";

import { getTSNodeRange } from "../getTSNodeRange.ts";
import { typescriptLanguage } from "../language.ts";
import { isArrayOrTupleTypeAtLocation } from "./utils/isArrayOrTupleTypeAtLocation.ts";

export default typescriptLanguage.createRule({
	about: {
		description:
			"Reports using `1` as the depth argument of `.flat()` since it is the default.",
		id: "arrayFlatUnnecessaryDepths",
		presets: ["stylistic"],
	},
	messages: {
		unnecessaryDepth: {
			primary: "Unnecessary depth argument of `1` in `.flat()` call.",
			secondary: [
				"The default depth for `.flat()` is `1`, so passing it explicitly is redundant.",
			],
			suggestions: ["Remove the depth argument."],
		},
	},
	setup(context) {
		return {
			visitors: {
				CallExpression: (node, { sourceFile, typeChecker }) => {
					if (
						!ts.isPropertyAccessExpression(node.expression) ||
						node.expression.name.text !== "flat" ||
						node.arguments.length !== 1
					) {
						return;
					}

					// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
					const arg = node.arguments[0]!;

					// TODO: Use a util like getStaticValue
					// https://github.com/flint-fyi/flint/issues/1298
					if (!ts.isNumericLiteral(arg) || arg.text !== "1") {
						return;
					}

					if (
						!isArrayOrTupleTypeAtLocation(
							node.expression.expression,
							typeChecker,
						)
					) {
						return;
					}

					context.report({
						message: "unnecessaryDepth",
						range: getTSNodeRange(arg, sourceFile),
					});
				},
			},
		};
	},
});
