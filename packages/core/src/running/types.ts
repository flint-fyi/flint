import type {
	AnyLanguage,
	AnyLanguageFileDefinition,
	AnyLanguageFileMetadata,
} from "../types/languages.ts";

export interface LanguageAndFilesMetadata {
	fileMetadata: AnyLanguageFileMetadata;
	language: AnyLanguage;
}

export interface LanguageFilesWithOptions {
	languageFiles: AnyLanguageFileDefinition[];
	options: unknown;
}
