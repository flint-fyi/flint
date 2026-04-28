import type { AnyLanguage, AnyLanguageFile } from "../types/languages.ts";

export interface LanguageAndFile {
	file: AnyLanguageFile;
	language: AnyLanguage;
}

export interface LanguageFilesWithOptions {
	languageFiles: LanguageAndFile[];
	options: unknown;
}
