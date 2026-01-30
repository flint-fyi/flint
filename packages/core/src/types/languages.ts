import type { CommentDirective } from "./directives.ts";
import type { LinterHost } from "./host.ts";
import type { FileReport } from "./reports.ts";
import type { Rule, RuleAbout, RuleDefinition, RuleRuntime } from "./rules.ts";
import type { AnyOptionalSchema, InferredOutputObject } from "./shapes.ts";

export type AnyLanguage = Language<object, object>;
export type AnyLanguageFile = LanguageFile<object>;
export type AnyLanguageFileFactory = LanguageFileFactory<object>;

export type GetLanguageAstNodesByName<InputLanguage extends AnyLanguage> =
	// eslint-disable-next-line @typescript-eslint/no-unused-vars -- Fixes TS inference.
	InputLanguage extends Language<infer AstNodesByName, infer _>
		? AstNodesByName
		: never;

export type GetLanguageFileServices<InputLanguage extends AnyLanguage> =
	// eslint-disable-next-line @typescript-eslint/no-unused-vars -- Fixes TS inference.
	InputLanguage extends Language<infer _, infer FileServices>
		? FileServices
		: never;

export interface LanguageCreateRule<
	AstNodesByName,
	FileServices extends object,
> {
	<const About extends RuleAbout, const MessageId extends string>(
		definition: RuleDefinition<
			About,
			AstNodesByName,
			FileServices,
			MessageId,
			undefined
		>,
	): Rule<About, object, object, MessageId, undefined>;

	<
		const About extends RuleAbout,
		const MessageId extends string,
		const OptionsSchema extends AnyOptionalSchema,
	>(
		definition: RuleDefinition<
			About,
			AstNodesByName,
			FileServices,
			MessageId,
			OptionsSchema
		>,
	): Rule<About, object, object, MessageId, OptionsSchema>;
}

/**
 * Description of a file's representation in the file system.
 */
export interface FileAboutData {
	filePath: string;
	filePathAbsolute: string;
	sourceText: string;
}

export interface Language<
	AstNodesByName,
	FileServices extends object,
> extends LanguageDefinition<AstNodesByName, FileServices> {
	createFileFactory(host: LinterHost): LanguageFileFactory<FileServices>;
	createRule: LanguageCreateRule<AstNodesByName, FileServices>;
	getFileCacheImpacts?(
		file: LanguageFile<FileServices>,
	): LanguageFileCacheImpacts;
	getFileDiagnostics?(file: LanguageFile<FileServices>): LanguageDiagnostics;
	runFileVisitors<
		OptionsSchema extends AnyOptionalSchema | undefined =
			| AnyOptionalSchema
			| undefined,
	>(
		file: LanguageFile<FileServices>,
		options: InferredOutputObject<OptionsSchema>,
		runtime: RuleRuntime<AstNodesByName, FileServices>,
	): void;
}

export interface LanguageAbout {
	name: string;
}

export type LanguageDiagnostics = LanguageFileDiagnostic[];

export interface LanguageFileDiagnostic {
	code?: string;
	text: string;
}

/**
 * The definition of a language, as provided to language creators internally.
 */
export interface LanguageDefinition<
	AstNodesByName,
	FileServices extends object,
> {
	about: LanguageAbout;
	createFileFactory(
		host: LinterHost,
	): LanguageFileFactoryDefinition<FileServices>;
	getFileCacheImpacts?(
		file: LanguageFile<FileServices>,
	): LanguageFileCacheImpacts;
	getFileDiagnostics?(file: LanguageFile<FileServices>): LanguageDiagnostics;
	runFileVisitors<
		OptionsSchema extends AnyOptionalSchema | undefined =
			| AnyOptionalSchema
			| undefined,
	>(
		file: LanguageFile<FileServices>,
		options: InferredOutputObject<OptionsSchema>,
		runtime: RuleRuntime<AstNodesByName, FileServices>,
	): void;
}

export interface LanguageFileCacheImpacts {
	dependencies: string[];
}

/**
 * Creates prepared information around files to be linted.
 */
export interface LanguageFileFactory<FileServices extends object> {
	createFile(data: FileAboutData): LanguageFile<FileServices>;
}

/**
 * Prepared information about a file to be linted.
 */
export type LanguageFile<FileServices extends object> = Disposable &
	LanguageFileBase<FileServices>;

/**
 * Common information about a file to be linted.
 */
export interface LanguageFileBase<FileServices extends object> {
	about: FileAboutData;
	directives?: CommentDirective[];
	reports?: FileReport[];
	services: FileServices;
}

/**
 * Internal definition of prepared information about a file to be linted.
 */
export type LanguageFileDefinition<FileServices extends object> =
	LanguageFileBase<FileServices> & Partial<Disposable>;

/**
 * Internal definition of how to create prepared information about files to be linted.
 * @remarks
 * This is the same as {@link LanguageFileFactoryDefinition}, but the created files
 * are {@link LanguageFileDefinition}s (which do not have to be disposable), rather
 * than {@link LanguageFile}s (which are always disposable).
 */
export interface LanguageFileFactoryDefinition<FileServices extends object> {
	createFile(data: FileAboutData): LanguageFileDefinition<FileServices>;
}
