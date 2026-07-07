import type { FinalizedFileResults } from "../running/finalizeFileResults.ts";
import type { FileCacheStorage } from "./cache.ts";
import type { LanguageReport } from "./languages.ts";
import type { FileReport } from "./reports.ts";

export interface FileResults {
	dependencies: Set<string>;
	languageReports: LanguageReport[];
	reports: FileReport[];
}

export interface LintResults {
	allFilePaths: Set<string>;
	allFileResults: Map<string, FinalizedFileResults>;
	cached: Map<string, FileCacheStorage> | undefined;
	ruleCount: number;
}

export interface LintResultsMaybeWithChanges extends LintResults {
	changed?: Set<string>;
}

export interface LintResultsWithChanges extends LintResults {
	changed: Set<string>;
}
