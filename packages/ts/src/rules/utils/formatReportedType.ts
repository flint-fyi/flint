import type { Checker } from "@flint.fyi/typescript-language";
import type { Type } from "@flint.fyi/typescript-language/native/sync";

export function formatReportedType(type: Type, typeChecker: Checker): string {
	return type.isErrorType() ? "error" : typeChecker.typeToString(type);
}
