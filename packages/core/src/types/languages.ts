import type { CommentDirective } from "./directives.ts";
import type { LinterHost } from "./host.ts";
import type { FileReport } from "./reports.ts";
import type { Rule, RuleAbout, RuleDefinition, RuleRuntime } from "./rules.ts";
import type { AnyOptionalSchema, InferredOutputObject } from "./shapes.ts";

export type AnyLanguage = Language<object, object>;
export type AnyLanguageFileDefinition = LanguageFileDefinition<object, object>;
export type AnyLanguageFileFactory = LanguageFileFactory<object, object>;
export type AnyLanguageFileMetadata = LanguageFileMetadata<object, object>;

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
	createFileFactory(
		host: LinterHost,
	): LanguageFileFactory<AstNodesByName, FileServices>;
	createRule: LanguageCreateRule<AstNodesByName, FileServices>;
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
	): LanguageFileFactoryDefinition<AstNodesByName, FileServices>;
}

export interface LanguageFileCacheImpacts {
	dependencies: string[];
}

// TODO: Perhaps the LanguageFile wrappers could be removed altogether?
// Maybe the Languages themselves should handle diagnostics, runVisitors, etc.?
// Then we would have 1-2 fewer objects per file...

/**
 * Wraps a file to be linted by any number of rules.
 */
export interface LanguageFile<
	AstNodesByName,
	FileServices extends object,
> extends Disposable {
	about: FileAboutData;
	cache?: LanguageFileCacheImpacts;
	getDiagnostics?(): LanguageDiagnostics;
	runVisitors<
		OptionsSchema extends AnyOptionalSchema | undefined =
			| AnyOptionalSchema
			| undefined,
	>(
		options: InferredOutputObject<OptionsSchema>,
		runtime: RuleRuntime<AstNodesByName, FileServices>,
	): void;
}

/**
 * Internal definition of how to wrap a file to be linted by any number of rules.
 */
export interface LanguageFileDefinition<
	AstNodesByName,
	FileServices extends object,
> extends Partial<Disposable> {
	about: FileAboutData;
	cache?: LanguageFileCacheImpacts;
	getDiagnostics?(): LanguageDiagnostics;
	runVisitors<
		OptionsSchema extends AnyOptionalSchema | undefined =
			| AnyOptionalSchema
			| undefined,
	>(
		options: InferredOutputObject<OptionsSchema>,
		runtime: RuleRuntime<AstNodesByName, FileServices>,
	): void;
}

/**
 * Creates wrappers around files to be linted.
 */
export interface LanguageFileFactory<
	AstNodesByName,
	FileServices extends object,
> extends Disposable {
	prepareFile(
		data: FileAboutData,
	): LanguageFileMetadata<AstNodesByName, FileServices>;
}

/**
 * Prepared information about a file to be linted.
 */
export interface LanguageFileMetadata<
	AstNodesByName,
	FileServices extends object,
> {
	directives?: CommentDirective[];
	file: LanguageFile<AstNodesByName, FileServices>;
	reports?: FileReport[];
}

/**
 * Internal definition of how to create wrappers around files to be linted.
 */
export interface LanguageFileFactoryDefinition<
	AstNodesByName,
	FileServices extends object,
> extends Partial<Disposable> {
	prepareFile(
		data: FileAboutData,
	): LanguageFileMetadataDefinition<AstNodesByName, FileServices>;
}

/**
 * Internal definition of prepared information about a file to be linted.
 */
export interface LanguageFileMetadataDefinition<
	AstNodesByName,
	FileServices extends object,
> {
	directives?: CommentDirective[];
	file: LanguageFileDefinition<AstNodesByName, FileServices>;
	reports?: FileReport[];
}
