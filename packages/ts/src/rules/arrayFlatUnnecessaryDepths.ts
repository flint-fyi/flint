import { SyntaxKind } from "typescript-native/unstable/ast";

import {
	getStaticNumberValue,
	getTSNodeRange,
	typescriptLanguage,
} from "@flint.fyi/typescript-language";

import { ruleCreator } from "./ruleCreator.ts";
import { isArrayOrTupleTypeAtLocation } from "./utils/isArrayOrTupleTypeAtLocation.ts";

export default ruleCreator.createRule(typescriptLanguage, {
	about: {
		description:
			"Reports using `1` as the depth argument of `.flat()` since it is the default.",
		id: "arrayFlatUnnecessaryDepths",
		presets: ["stylistic", "stylisticStrict"],
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
				CallExpression: (node, { sourceFile, checker }) => {
					if (
						node.expression.kind !== SyntaxKind.PropertyAccessExpression ||
						node.expression.name.text !== "flat" ||
						node.arguments.length !== 1
					) {
						return;
					}

					// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
					const arg = node.arguments[0]!;

					if (getStaticNumberValue(arg) !== 1) {
						return;
					}

					if (
						!isArrayOrTupleTypeAtLocation(node.expression.expression, checker)
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
