import z from "zod";

import type { CacheStorage } from "../types/cache.ts";
import type { Suggestion, SuggestionForFile } from "../types/changes.ts";

const characterReportRangeSchema = z.object({
	begin: z.number(),
	end: z.number(),
});

const columnAndLineSchema = z.object({
	column: z.number(),
	line: z.number(),
	raw: z.number(),
});

const normalizedReportRangeObjectSchema = z.object({
	begin: columnAndLineSchema,
	end: columnAndLineSchema,
});

const fixSchema = z.object({
	range: characterReportRangeSchema,
	text: z.string(),
});

// Note: SuggestionForFiles with functions cannot be cached (not serializable)
const suggestionSchema = z.object({
	id: z.string(),
	range: characterReportRangeSchema,
	text: z.string(),
});

const reportMessageDataSchema = z.object({
	primary: z.string(),
	secondary: z.array(z.string()),
	suggestions: z.array(z.string()),
});

const baseAboutSchema = z.object({
	id: z.string(),
	presets: z.array(z.string()).optional(),
});

const reportInterpolationDataSchema = z.record(
	z.string(),
	z.union([z.boolean(), z.number(), z.string()]),
);

const fileReportSchema = z.object({
	about: baseAboutSchema,
	data: reportInterpolationDataSchema.optional(),
	dependencies: z.array(z.string()).optional(),
	fix: z.array(fixSchema).optional(),
	message: reportMessageDataSchema,
	range: normalizedReportRangeObjectSchema,
	suggestions: z.array(suggestionSchema).optional(),
});

const languageFileDiagnosticSchema = z.object({
	code: z.string().optional(),
	text: z.string(),
});

const fileCacheStorageSchema = z.object({
	dependencies: z.array(z.string()).optional(),
	diagnostics: z.array(languageFileDiagnosticSchema).optional(),
	reports: z.array(fileReportSchema).optional(),
	timestamp: z.number(),
});

const cacheStorageSchema = z.object({
	configs: z.record(z.string(), z.number()),
	files: z.record(z.string(), fileCacheStorageSchema),
});

// JSON codec for bidirectional cache serialization
export const cacheStorageCodec = z.codec(
	z.string(), // input: raw JSON string
	cacheStorageSchema, // output: validated CacheStorage object
	{
		decode: (jsonString, ctx) => {
			try {
				// eslint-disable-next-line @typescript-eslint/no-unsafe-return
				return JSON.parse(jsonString);
			} catch (error: unknown) {
				ctx.issues.push({
					code: "invalid_format",
					format: "json",
					input: jsonString,
					message: error instanceof Error ? error.message : String(error),
				});
				return z.NEVER;
			}
		},
		encode: (value) => JSON.stringify(value, null, "\t"),
	},
);

/** The serializable form of CacheStorage (no functions) */
export type SerializableCacheStorage = z.output<typeof cacheStorageCodec>;

/**
 * Type guard to check if a suggestion is serializable (SuggestionForFile).
 * SuggestionForFiles contains functions and cannot be serialized to JSON.
 */
function isSerializableSuggestion(
	suggestion: Suggestion,
): suggestion is SuggestionForFile {
	return "range" in suggestion && "text" in suggestion;
}

/**
 * Converts CacheStorage to its serializable form by filtering out
 * non-serializable suggestions (SuggestionForFiles with functions).
 *
 * This handles the type transformation from CacheStorage (which can contain
 * SuggestionForFiles) to SerializableCacheStorage (which only contains
 * SuggestionForFile).
 */
export function toSerializableCacheStorage(
	cache: CacheStorage,
): SerializableCacheStorage {
	return {
		configs: cache.configs,
		files: Object.fromEntries(
			Object.entries(cache.files).map(([filePath, fileCache]) => [
				filePath,
				{
					...fileCache,
					reports: fileCache.reports?.map((report) => ({
						...report,
						suggestions: report.suggestions?.filter(isSerializableSuggestion),
					})),
				},
			]),
		),
	};
}
