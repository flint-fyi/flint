import type { AnyLanguage, AnyLanguageFile } from "../types/languages.ts";

/**
 * A file along with the language whose file factory created it.
 */
export interface LanguageAndFile {
	file: AnyLanguageFile;
	language: AnyLanguage;
}
