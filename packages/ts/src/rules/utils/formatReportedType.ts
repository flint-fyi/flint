import * as tsutils from "ts-api-utils";
import type ts from "typescript";

import type { Checker } from "@flint.fyi/typescript-language";

export function formatReportedType(
	type: ts.Type,
	typeChecker: Checker,
): string {
	return tsutils.isIntrinsicErrorType(type)
		? "error"
		: typeChecker.typeToString(type);
}
