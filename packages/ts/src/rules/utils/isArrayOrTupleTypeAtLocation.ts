import type { Type } from "typescript-native/unstable/sync";

import type { AST, Checker } from "@flint.fyi/typescript-language";

import { getConstrainedTypeAtLocation } from "./getConstrainedType.ts";
import { isTypeRecursive } from "./isTypeRecursive.ts";

export function isArrayOrTupleTypeAtLocation(
	node: AST.Expression,
	checker: Checker,
): boolean {
	return isArrayOrTupleType(
		getConstrainedTypeAtLocation(node, checker),
		checker,
	);
}

function isArrayOrTupleType(type: Type, checker: Checker): boolean {
	return isTypeRecursive(
		type,
		(constituent) =>
			checker.isArrayType(constituent) || checker.isTupleType(constituent),
	);
}
