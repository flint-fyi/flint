import type { Checker } from "@flint.fyi/typescript-language";
import * as tsutils from "ts-api-utils";
import type ts from "typescript";

export function formatReportedType(
	type: ts.Type,
	typeChecker: Checker,
): string {
	return tsutils.isIntrinsicErrorType(type)
		? "error"
		: typeChecker.typeToString(type);
}
