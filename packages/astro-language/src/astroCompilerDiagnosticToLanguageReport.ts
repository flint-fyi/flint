import type { DiagnosticMessage } from "@astrojs/compiler/types";
import {
	getPositionOfColumnAndLine,
	type LanguageReport,
	type SourceFileWithLineMap,
} from "@flint.fyi/core";

export function astroCompilerDiagnosticToLanguageReport(
	fileName: string,
	source: SourceFileWithLineMap,
	diagnostic: DiagnosticMessage,
): LanguageReport {
	// location.line and location.column are both 1-indexed
	const begin = getPositionOfColumnAndLine(source, {
		column: diagnostic.location.column - 1,
		line: diagnostic.location.line - 1,
	});
	return {
		code: `ASTRO${diagnostic.code}`,
		range: { begin, end: begin + diagnostic.location.length },
		text: `${fileName}:${diagnostic.location.line}:${diagnostic.location.column} - ${diagnostic.text}${diagnostic.hint ? ` (${diagnostic.hint})` : ""}`,
	};
}
