import z from "zod/v4";

import type { SuggestionForFile } from "../types/changes.ts";
import { jsonCodec } from "../utils/codecs.ts";
import { isSuggestionForFiles } from "../utils/predicates.ts";

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

const changeBaseSchema = z.object({
	id: z.string(),
});

const suggestionForFileSchema = changeBaseSchema.extend({
	range: characterReportRangeSchema,
	text: z.string(),
});

// Note: SuggestionForFiles cannot be cached because functions aren't serializable.
const suggestionForFilesSchema = changeBaseSchema.extend({
	files: z.record(
		z.string(),
		z
			.function({
				input: z.tuple([z.string()]),
				output: z.array(fixSchema),
			})
			.optional(),
	),
});

const suggestionSchema = z.union([
	suggestionForFileSchema,
	suggestionForFilesSchema,
]);

const reportMessageDataSchema = z.object({
	primary: z.string(),
	secondary: z.array(z.string()),
	suggestions: z.array(z.string()),
});

const baseAboutSchema = z.object({
	id: z.string(),
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
	suggestions: z
		.codec(z.array(suggestionForFileSchema), z.array(suggestionSchema), {
			decode: (suggestions) => suggestions,
			encode: (suggestions) =>
				suggestions.filter(
					(change): change is SuggestionForFile =>
						!isSuggestionForFiles(change),
				),
		})
		.optional(),
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

export const cacheStorageSchema = jsonCodec(
	z.object({
		configs: z.record(z.string(), z.number()),
		files: z.record(z.string(), fileCacheStorageSchema),
	}),
);
