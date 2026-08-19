import type ts from "typescript";

import type { Checker } from "@flint.fyi/typescript-language";
import tsutils from "@flint.fyi/typescript-language/ts-api-utils";

export function formatReportedType(
	type: ts.Type,
	typeChecker: Checker,
): string {
	return tsutils.isIntrinsicErrorType(type)
		? "error"
		: typeChecker.typeToString(type);
}
