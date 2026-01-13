import * as tsutils from "ts-api-utils";
import ts from "typescript";

import { typescriptLanguage } from "../language.ts";
import type { Checker } from "../types/checker.ts";
import { getConstrainedTypeAtLocation } from "./utils/getConstrainedType.ts";
import { isTypeRecursive } from "./utils/isTypeRecursive.ts";

export default typescriptLanguage.createRule({
	about: {
		description: "Reports iterating over an array with a for-in loop.",
		id: "forInArrays",
		preset: "logical",
	},
	messages: {
		forIn: {
			primary:
				"For-in loops over arrays have surprising behavior that often leads to bugs.",
			secondary: [
				"A for-in loop (`for (const i in o)`) iterates over all enumerable properties of an object, including those that are not array indices.",
				"This can lead to unexpected behavior when used with arrays, as it may include properties that are not part of the array's numeric indices.",
				"It also returns the index key (`i`) as a string, which is not the expected numeric type for array indices.",
			],
			suggestions: [
				"Use a construct more suited for arrays, such as a for-of loop (`for (const i of o)`).",
			],
		},
	},
	setup(context) {
		function hasNumberLikeLength(type: ts.Type, typeChecker: Checker): boolean {
			const lengthProperty = type.getProperty("length");

			if (lengthProperty == null) {
				return false;
			}

			return tsutils.isTypeFlagSet(
				typeChecker.getTypeOfSymbol(lengthProperty),
				ts.TypeFlags.NumberLike,
			);
		}

		function isArrayLike(type: ts.Type, typeChecker: Checker): boolean {
			return isTypeRecursive(
				type,
				(t) =>
					t.getNumberIndexType() != null && hasNumberLikeLength(t, typeChecker),
			);
		}

		return {
			visitors: {
				ForInStatement: (node, { typeChecker }) => {
					const type = getConstrainedTypeAtLocation(
						node.expression,
						typeChecker,
					);

					if (isArrayLike(type, typeChecker)) {
						context.report({
							message: "forIn",
							range: {
								begin: node.getStart(),
								end: node.statement.getStart() - 1,
							},
						});
					}
				},
			},
		};
	},
});
