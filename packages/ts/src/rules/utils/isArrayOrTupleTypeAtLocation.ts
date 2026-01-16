import type { AST, Checker } from "@flint.fyi/typescript-language";
import type ts from "typescript";

import { getConstrainedTypeAtLocation } from "./getConstrainedType.ts";
import { isTypeRecursive } from "./isTypeRecursive.ts";

export function isArrayOrTupleTypeAtLocation(
	node: AST.Expression,
	typeChecker: Checker,
) {
	return isArrayOrTupleType(
		getConstrainedTypeAtLocation(node, typeChecker),
		typeChecker,
	);
}

function isArrayOrTupleType(type: ts.Type, typeChecker: Checker): boolean {
	return isTypeRecursive(
		type,
		(constituent) =>
			typeChecker.isArrayType(constituent) ||
			typeChecker.isTupleType(constituent),
	);
}
