import type { LanguageBase, LanguageFile } from "../types/languages.ts";

/**
 * A file along with the language whose file factory created it.
 */
export interface LanguageAndFile {
	file: LanguageFile;
	language: LanguageBase;
}
