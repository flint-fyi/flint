import type { CommentDirective } from "./directives.ts";
import type { LinterHost } from "./host.ts";
import type { CharacterReportRange } from "./ranges.ts";
import type { FileReport } from "./reports.ts";
import type { Rule, RuleAbout, RuleDefinition, RuleVisitors } from "./rules.ts";
import type { AnyOptionalSchema } from "./shapes.ts";

export type LanguageCreateRule<AstNodesByName, FileServices extends object> = <
	const About extends RuleAbout,
	const MessageId extends string,
	OptionsSchema extends AnyOptionalSchema | undefined = undefined,
>(
	definition: RuleDefinition<
		About,
		AstNodesByName,
		FileServices,
		MessageId,
		OptionsSchema
	>,
) => Rule<About, MessageId, OptionsSchema>;

/**
 * Description of a file's representation in the file system.
 */
export interface FileAboutData {
	filePath: string;
	filePathAbsolute: string;
	sourceText: string;
}

/**
 * One rule's visitors for a file, along with the services they'll be given.
 * Each rule's services add its own options to the file's services,
 * so they're passed together to `use` rather than exposed under one type.
 */
export type FileVisitors<AstNodesByName, FileServices extends object> = <
	Result,
>(
	use: <VisitorServices extends FileServices>(
		services: VisitorServices,
		visitors: RuleVisitors<AstNodesByName, VisitorServices>,
	) => Result,
) => Result;

/**
 * A language, as used by the linter and its rules.
 */
export interface Language<
	AstNodesByName,
	FileServices extends object,
> extends LanguageBase {
	createRule: LanguageCreateRule<AstNodesByName, FileServices>;

	/**
	 * Creates a view of this language for rules that use services only some of its files provide.
	 * Rules created by the view run on this language's files.
	 */
	extendServices<Extra extends object>(): Language<
		AstNodesByName,
		FileServices & Partial<Extra>
	>;
}

export interface LanguageAbout {
	name: string;
}

/**
 * A language's members that don't depend on its AST nodes or file services.
 * Members that operate on one file are on that file, as {@link LanguageFileMembers}.
 */
export interface LanguageBase extends Pick<
	LanguageDefinition<unknown, object>,
	"about" | "orderFilePaths"
> {
	createFileFactory(host: LinterHost): LanguageFileFactory;
}

export interface LanguageReport {
	code?: string;
	range?: CharacterReportRange;
	source?: string;
	text: string;
}

export type LanguageReports = LanguageReport[];

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
	getFileCacheImpacts?: (
		file: LanguageFileDefinition<FileServices>,
		host: LinterHost,
	) => LanguageFileCacheImpacts;
	getLanguageReports?: (
		file: LanguageFileDefinition<FileServices>,
		host: LinterHost,
	) => LanguageReports;
	orderFilePaths?: (filePaths: readonly string[], host: LinterHost) => string[];
	runFileVisitors: (
		file: LanguageFileDefinition<FileServices>,
		fileVisitors: readonly FileVisitors<AstNodesByName, FileServices>[],
	) => void;
}

export interface LanguageFileCacheImpacts {
	dependencies: string[];
	isGlobalDependency: boolean;
}

/**
 * Creates prepared information around files to be linted.
 */
export interface LanguageFileFactory extends Partial<Disposable> {
	createFile(data: FileAboutData): LanguageFile;
}

/**
 * Prepared information about a file to be linted.
 * Its services are only available to its language and that language's rules.
 */
export interface LanguageFile
	extends Disposable, LanguageFileBase, LanguageFileMembers {}

/**
 * A language's members for one file, bound by the language that created the file.
 */
export interface LanguageFileMembers {
	getFileCacheImpacts?: (host: LinterHost) => LanguageFileCacheImpacts;
	getLanguageReports?: (host: LinterHost) => LanguageReports;

	/**
	 * Runs the visitors that rules have added for this file, then clears them.
	 */
	runFileVisitors: () => void;
}

/**
 * Common information about a file to be linted.
 */
export interface LanguageFileBase {
	about: FileAboutData;

	/**
	 * Maps a range from the language's analysis text to the original source text.
	 * @param range The range produced by a rule.
	 * @param kind `report` maps a diagnostic highlight and may use a language-specific fallback.
	 * `change` maps an autofix or suggestion replacement and must preserve the edit's meaning;
	 * the replacement text is applied unchanged to the mapped range.
	 * @returns The source range, or `null` to discard the diagnostic or individual edit.
	 */
	adjustReportRange?: (
		range: CharacterReportRange,
		kind: "change" | "report",
	) => CharacterReportRange | null;
	directives?: CommentDirective[];
	reports?: FileReport[];
}

/**
 * Internal definition of prepared information about a file to be linted.
 */
export interface LanguageFileDefinition<FileServices extends object>
	extends LanguageFileBase, Partial<Disposable> {
	services: FileServices;
}

/**
 * Internal definition of how to create prepared information about files to be linted.
 * @remarks
 * This is the same as {@link LanguageFileFactoryDefinition}, but the created files
 * are {@link LanguageFileDefinition}s (which do not have to be disposable), rather
 * than {@link LanguageFile}s (which are always disposable).
 */
export interface LanguageFileFactoryDefinition<
	FileServices extends object,
> extends Partial<Disposable> {
	createFile(data: FileAboutData): LanguageFileDefinition<FileServices>;
}
