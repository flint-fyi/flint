export { getCacheFilePath } from "./cache/getCacheFilePath.ts";
export { writeToCache } from "./cache/writeToCache.ts";
export { applyChangesToText } from "./changing/applyChangesToText.ts";
export { defineConfig } from "./configs/defineConfig.ts";
export {
	configFileNameCandidates,
	findConfigFileName,
} from "./configs/findConfigFileName.ts";
export { isConfig } from "./configs/isConfig.ts";
export { validateConfigDefinition } from "./configs/validateConfigDefinition.ts";
export { DirectivesCollector } from "./directives/DirectivesCollector.ts";
export { directiveReports } from "./directives/reports/directiveReports.ts";
export { globs } from "./globs/index.ts";
export { createDiskBackedLinterHost } from "./host/createDiskBackedLinterHost.ts";
export { createEphemeralLinterHost } from "./host/createEphemeralLinterHost.ts";
export {
	createVFSLinterHost,
	type CreateVFSLinterHostOpts,
} from "./host/createVFSLinterHost.ts";
export { isFileSystemCaseSensitive } from "./host/isFileSystemCaseSensitive.ts";
export {
	commonlyIgnoredPaths,
	gitVcs,
	jjVcs,
	nodeModulesCache,
	nodeModulesDir,
	vcsDirectories,
} from "./host/watcher.ts";
export { createLanguage } from "./languages/createLanguage.ts";
export { createPlugin } from "./plugins/createPlugin.ts";
export { formatReport } from "./reporting/formatReport.ts";
export { RuleCreator, type RuleCreatorOptions } from "./rules/RuleCreator.ts";
export { parseOptions } from "./running/parseOptions.ts";
export { processRuleReport } from "./running/processRuleReport.ts";
export { runConfig } from "./running/runConfig.ts";
export { runConfigFixing } from "./running/runConfigFixing.ts";
export { runLintRule } from "./running/runLintRule.ts";
export type { BaseAbout } from "./types/about.ts";
export type {
	CacheStorage,
	FileCacheImpacts,
	FileCacheStorage,
} from "./types/cache.ts";
export type {
	Change,
	ChangeBase,
	FileChange,
	Fix,
	ResolvedChange,
	Suggestion,
	SuggestionForFile,
	SuggestionForFiles,
} from "./types/changes.ts";
export type {
	Config,
	ConfigDefinition,
	ConfigRuleDefinition,
	ConfigRuleDefinitionObject,
	ConfigUseDefinition,
} from "./types/configs.ts";
export type {
	MessageForContext,
	RuleContext,
	RuleReporter,
} from "./types/context.ts";
export type {
	CommentDirective,
	CommentDirectiveType,
	CommentDirectiveTypeWithinFile,
	CommentDirectiveWithinFile,
} from "./types/directives.ts";
export type { FormattingResults } from "./types/formatting.ts";
export type {
	LinterHost,
	LinterHostDirectoryEntry,
	LinterHostDirectoryWatcher,
	LinterHostFileWatcher,
	LinterHostFileWatcherEvent,
	VFSLinterHost,
	WatchDirectoryOptions,
	WatchOptions,
} from "./types/host.ts";
export type {
	AnyLanguage,
	AnyLanguageFile,
	AnyLanguageFileFactory,
	FileAboutData,
	GetLanguageAstNodesByName,
	GetLanguageFileServices,
	Language,
	LanguageAbout,
	LanguageCreateRule,
	LanguageDefinition,
	LanguageFile,
	LanguageFileBase,
	LanguageFileCacheImpacts,
	LanguageFileDefinition,
	LanguageFileFactory,
	LanguageFileFactoryDefinition,
	LanguageReport,
	LanguageReports,
} from "./types/languages.ts";
export type {
	FileResults,
	LintResults,
	LintResultsMaybeWithChanges,
	LintResultsWithChanges,
} from "./types/linting.ts";
export type { RunMode } from "./types/modes.ts";
export type {
	Plugin,
	PluginPresets,
	PluginRulesFactory,
} from "./types/plugins.ts";
export type {
	CharacterReportRange,
	ColumnAndLine,
	ColumnAndLineWithoutRaw,
} from "./types/ranges.ts";
export type {
	FileReport,
	FileReportAbout,
	FileReportWithFix,
	NormalizedReport,
	NormalizedReportRangeObject,
	ReportInterpolationData,
	ReportMessageData,
	RuleReport,
} from "./types/reports.ts";
export type {
	AnyRule,
	AnyRuleDefinition,
	Rule,
	RuleAbout,
	RuleDefinition,
	RuleRuntime,
	RuleSetup,
	RuleTeardown,
	RuleVisitor,
	RuleVisitors,
} from "./types/rules.ts";
export type {
	AnyOptionalSchema,
	InferredInputObject,
	InferredOutputObject,
	OptionalObjectSchema,
} from "./types/shapes.ts";
export type { WithExitKeys } from "./types/visitors.ts";
export { binarySearch } from "./utils/arrays.ts";
export {
	getColumnAndLineOfPosition,
	getPositionOfColumnAndLine,
	type HasGetLineAndCharacterOfPosition,
	type SourceFileWithLineMap,
	type SourceFileWithLineMapAndFileName,
	type TSLineAndCharacter,
} from "./utils/getColumnAndLineOfPosition.ts";
export { hasFix, isSuggestionForFiles } from "./utils/predicates.ts";
