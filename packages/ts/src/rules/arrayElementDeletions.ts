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
		description: "Reports using the `delete` operator on array values.",
		id: "arrayElementDeletions",
		presets: ["logical"],
	},
	messages: {
		noArrayDelete: {
			primary: "Avoid using the `delete` operator on arrays.",
			secondary: [
				"Using `delete` on an array element removes it but leaves an empty slot, which can lead to unexpected behavior.",
				"The array's `length` property is not affected, and the element becomes `undefined` with a hole in the array.",
			],
			suggestions: [
				"Use `Array#splice()` to remove elements and shift remaining elements.",
			],
		},
	},
	setup(context) {
		return {
			visitors: {
				DeleteExpression: (node, { sourceFile, typeChecker }) => {
					if (!ts.isElementAccessExpression(node.expression)) {
						return;
					}

					const objectType = getConstrainedTypeAtLocation(
						node.expression.expression,
						typeChecker,
					);

					if (!isArrayOrTupleType(objectType, typeChecker)) {
						return;
					}

					context.report({
						message: "noArrayDelete",
						range: getTSNodeRange(node, sourceFile),
					});
				},
			},
		};
	},
});
