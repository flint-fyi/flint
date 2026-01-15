import { typescriptLanguage } from "@flint.fyi/typescript-language";
import * as tsutils from "ts-api-utils";
import ts from "typescript";

import { ruleCreator } from "./ruleCreator.ts";
import { getConstrainedTypeAtLocation } from "./utils/getConstrainedType.ts";

function isVoidOrUndefinedType(type: ts.Type) {
	return tsutils.isTypeFlagSet(
		type,
		ts.TypeFlags.Void | ts.TypeFlags.Undefined,
	);
}

export default ruleCreator.createRule(typescriptLanguage, {
	about: {
		description:
			"Reports using the void operator on expressions that are already void or undefined.",
		id: "meaninglessVoidOperators",
		presets: ["logical"],
	},
	messages: {
		meaninglessVoid: {
			primary:
				"Using the `void` operator on a value of type `{{ type }}` does nothing.",
			secondary: [
				"The `void` operator is meant to discard a return value and produce `undefined`.",
				"Applying `void` to a value that is already `void` or `undefined` has no effect.",
			],
			suggestions: [
				"Remove the `void` operator.",
				"If you need to explicitly return `undefined`, use the value directly.",
			],
		},
	},
	setup(context) {
		return {
			visitors: {
				VoidExpression: (node, { sourceFile, typeChecker }) => {
					const argumentType = getConstrainedTypeAtLocation(
						node.expression,
						typeChecker,
					);

					const unionParts = tsutils.unionConstituents(argumentType);

					if (!unionParts.every(isVoidOrUndefinedType)) {
						return;
					}

					context.report({
						data: {
							type: typeChecker.typeToString(argumentType),
						},
						message: "meaninglessVoid",
						range: {
							begin: node.getStart(sourceFile),
							end: node.getEnd(),
						},
					});
				},
			},
		};
	},
});
