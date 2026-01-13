import type { CharacterReportRange } from "./ranges.ts";

export type Change = Fix | Suggestion;

export interface ChangeBase {
	/**
	 * User-facing identifier allowing the change to be referenced.
	 */
	id: string;
}

export interface ResolvedChange extends FileChange {
	filePath: string;
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
export type Suggestion = SuggestionForFile | SuggestionForFiles;

/**
 * Generates text change data for a file based on its text content.
 * @param text Original text content of the file.
 * @returns Any number of text changes to be made to the file.
 */
export type SuggestionForFileGenerator = (text: string) => FileChange[];

/**
 * A suggestion that applies to one or more separate files.
 */
export interface SuggestionForFiles extends ChangeBase {
	files: Partial<Record<string, SuggestionForFileGenerator>>;
}

/**
 * A suggestion that applies to the file being linted.
 */
export type SuggestionForFile = ChangeBase & FileChange;
