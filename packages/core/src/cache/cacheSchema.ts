import z from "zod";

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

export const cacheStorageSchema = z.object({
	configs: z.record(z.string(), z.number()),
	files: z.record(z.string(), fileCacheStorageSchema),
});
