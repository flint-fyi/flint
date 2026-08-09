// eslint-disable-next-line @typescript-eslint/no-restricted-imports -- TODO: Use Zod Mini in core package
import z from "zod/v4";

import type { BaseAbout } from "../types/about.ts";
import type {
	CacheStorage,
	FileCacheStorage,
	GlobalInvalidation,
} from "../types/cache.ts";
import type {
	Fix,
	Suggestion,
	SuggestionForFile,
	SuggestionForFiles,
} from "../types/changes.ts";
import type { LanguageReport } from "../types/languages.ts";
import type { CharacterReportRange, ColumnAndLine } from "../types/ranges.ts";
import type {
	FileReport,
	NormalizedReportRangeObject,
	ReportInterpolationData,
	ReportMessageData,
} from "../types/reports.ts";
import { jsonCodec } from "../utils/codecs.ts";

const characterReportRangeSchema: z.ZodType<CharacterReportRange> = z.object({
	begin: z.number(),
	end: z.number(),
});

const columnAndLineSchema: z.ZodType<ColumnAndLine> = z.object({
	column: z.number(),
	line: z.number(),
	raw: z.number(),
});

const normalizedReportRangeObjectSchema: z.ZodType<NormalizedReportRangeObject> =
	z.object({
		begin: columnAndLineSchema,
		end: columnAndLineSchema,
	});

const fixSchema: z.ZodType<Fix> = z.object({
	range: characterReportRangeSchema,
	text: z.string(),
});

const changeBaseSchema = z.object({
	id: z.string(),
});

const suggestionForFileSchema: z.ZodType<SuggestionForFile> =
	changeBaseSchema.extend({
		range: characterReportRangeSchema,
		text: z.string(),
	});

const suggestionForFilesSchema: z.ZodType<SuggestionForFiles> =
	changeBaseSchema.extend({
		files: z.record(z.string(), z.array(fixSchema).exactOptional()),
	});

const suggestionSchema: z.ZodType<Suggestion> = z.union([
	suggestionForFileSchema,
	suggestionForFilesSchema,
]);

const reportMessageDataSchema: z.ZodType<ReportMessageData> = z.object({
	primary: z.string(),
	secondary: z.array(z.string()),
	suggestions: z.array(z.string()),
});

const baseAboutSchema: z.ZodType<BaseAbout> = z.object({
	id: z.string(),
	url: z.string().exactOptional(),
});

const reportInterpolationDataSchema: z.ZodType<ReportInterpolationData> =
	z.record(z.string(), z.union([z.boolean(), z.number(), z.string()]));

const fileReportSchema: z.ZodType<FileReport> = z.object({
	about: baseAboutSchema,
	data: reportInterpolationDataSchema.exactOptional(),
	dependencies: z.array(z.string()).exactOptional(),
	fix: z.array(fixSchema).exactOptional(),
	message: reportMessageDataSchema,
	range: normalizedReportRangeObjectSchema,
	suggestions: z.array(suggestionSchema).exactOptional(),
});

const languageReportSchema: z.ZodType<LanguageReport> = z.object({
	code: z.string().exactOptional(),
	source: z.string().exactOptional(),
	range: characterReportRangeSchema.exactOptional(),
	text: z.string(),
});

const fileCacheStorageSchema: z.ZodType<FileCacheStorage> = z.object({
	dependencies: z.array(z.string()).exactOptional(),
	languageReports: z.array(languageReportSchema).exactOptional(),
	reports: z.array(fileReportSchema).exactOptional(),
	timestamp: z.number(),
});

const globalInvalidation: z.ZodType<GlobalInvalidation> = z.object({
	filePath: z.string(),
	touchTime: z.number(),
});

const cacheStorageSchemaObject: z.ZodType<CacheStorage> = z.object({
	configs: z.record(z.string(), z.number()),
	files: z.record(z.string(), fileCacheStorageSchema),
	globalInvalidations: z.array(globalInvalidation),
});

export const cacheStorageSchema: z.ZodCodec<
	z.ZodString,
	z.ZodType<CacheStorage>
> = jsonCodec(cacheStorageSchemaObject);
