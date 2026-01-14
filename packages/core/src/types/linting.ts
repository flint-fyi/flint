import type { FileCacheStorage } from "./cache.ts";
import type { LanguageFileDiagnostic } from "./languages.ts";
import type { FileReport } from "./reports.ts";

export interface FileResults {
	dependencies: Set<string>;
	diagnostics: LanguageFileDiagnostic[];
	reports: FileReport[];
}

export interface LintResults {
	allFilePaths: Set<string>;
	cached: Map<string, FileCacheStorage> | undefined;
	filesResults: Map<string, FileResults>;
}

export interface LintResultsMaybeWithChanges extends LintResults {
	changed?: Set<string>;
}

export interface LintResultsWithChanges extends LintResults {
	changed: Set<string>;
}
