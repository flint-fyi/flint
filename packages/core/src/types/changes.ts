import type { CharacterReportRange } from "./ranges.ts";

export type Change = Fix | Suggestion;

export interface ChangeBase {
	/**
	 * User-facing identifier allowing the change to be referenced.
	 */
	id: string;
}

export interface FileChangeset extends MetaChange {
	patches?: FileChange[];
}

export interface ResolvedChange extends FileChange {
	filePath: string;
}

export interface ResolvedChangeset extends MetaChange {
	patches: ResolvedChange[];
}

/**
 * Base data for a text change to a file.
 */
export interface FileChange {
	/**
	 * Range of text in the file to be updated.
	 */
	range: CharacterReportRange;

	/**
	 * New value for the text in the range.
	 */
	text: string;
}

/**
 * A "fix" (direct text change) to be made to a file.
 */
export type Fix = FileChange;

/**
 * A "suggestion" (potentially unsafe text change) to be made to file(s).
 */
export interface MetaChange {
	newPath?: string;
}

export type Suggestion = SuggestionForFile | SuggestionForFiles;

/**
 * A suggestion that applies to one or more separate files.
 */
export interface SuggestionForFiles extends ChangeBase {
	files: Record<string, FileChange[] | FileChangeset>;
}

/**
 * A suggestion that applies to the file being linted.
 */
export type SuggestionForFile = ChangeBase & FileChange;
