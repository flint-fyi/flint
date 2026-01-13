import * as ts from "typescript";

import { getTSNodeRange } from "../getTSNodeRange.ts";
import { typescriptLanguage } from "../language.ts";
import { getConstrainedTypeAtLocation } from "./utils/getConstrainedType.ts";
import { isTypeRecursive } from "./utils/isTypeRecursive.ts";

function isArrayOrTupleType(
	type: ts.Type,
	typeChecker: ts.TypeChecker,
): boolean {
	return isTypeRecursive(
		type,
		(t) => typeChecker.isArrayType(t) || typeChecker.isTupleType(t),
	);
}

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
					if (!ts.isPropertyAccessExpression(node.expression)) {
						return;
					}

					if (node.expression.name.text !== "flat") {
						return;
					}

					if (node.arguments.length !== 1) {
						return;
					}

					const arg = node.arguments[0];
					if (!arg || !ts.isNumericLiteral(arg) || arg.text !== "1") {
						return;
					}

					const receiverType = getConstrainedTypeAtLocation(
						node.expression.expression,
						typeChecker,
					);

					if (!isArrayOrTupleType(receiverType, typeChecker)) {
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
