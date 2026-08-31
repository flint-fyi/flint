import type { Type } from "typescript-native/unstable/sync";

import type { Checker } from "@flint.fyi/typescript-language";

export function formatReportedType(type: Type, typeChecker: Checker): string {
	return type.isErrorType() ? "error" : typeChecker.typeToString(type);
}
