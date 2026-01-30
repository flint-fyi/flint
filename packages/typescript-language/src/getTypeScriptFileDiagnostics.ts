import type { LanguageFile, LanguageFileDiagnostic } from "@flint.fyi/core";
import ts from "typescript";

import { convertTypeScriptDiagnosticToLanguageFileDiagnostic } from "./convertTypeScriptDiagnosticToLanguageFileDiagnostic.ts";
import type { TypeScriptFileServices } from "./language.ts";

export function getTypeScriptFileDiagnostics(
	file: LanguageFile<TypeScriptFileServices>,
): LanguageFileDiagnostic[] {
	return ts
		.getPreEmitDiagnostics(file.services.program, file.services.sourceFile)
		.map(convertTypeScriptDiagnosticToLanguageFileDiagnostic);
}
