import { z } from "zod/v4";

export const linterNameSchema = z.union([
	z.literal("biome"),
	z.literal("deno"),
	z.literal("eslint"),
	z.literal("markdownlint"),
	z.literal("oxlint"),
	z.literal("stylelint"),
]);

export type LinterName = z.infer<typeof linterNameSchema>;

export const flintRuleStatusSchema = z.union([
	z.literal("implemented"),
	z.literal("skipped"),
]);

export type FlintRuleStatus = z.infer<typeof flintRuleStatusSchema>;

export const flintRuleReferenceSchema = z.object({
	name: linterNameSchema,
	plugin: z.string(),
	preset: z.string(),
	status: flintRuleStatusSchema.optional(),
	strictness: z.string().optional(),
});

export type FlintRuleReference = z.infer<typeof flintRuleReferenceSchema>;

export const linterRuleReferenceSchema = z.object({
	name: z.string(),
	url: z.string(),
});

export type LinterRuleReference = z.infer<typeof linterRuleReferenceSchema>;

export const comparisonSchema = z.object({
	biome: z.array(linterRuleReferenceSchema).optional(),
	deno: z.array(linterRuleReferenceSchema).optional(),
	eslint: z.array(linterRuleReferenceSchema).optional(),
	flint: flintRuleReferenceSchema,
	markdownlint: z.array(linterRuleReferenceSchema).optional(),
	notes: z.string().optional(),
	oxlint: z.array(linterRuleReferenceSchema).optional(),
	stylelint: z.array(linterRuleReferenceSchema).optional(),
});

export type Comparison = z.infer<typeof comparisonSchema>;

export const comparisonsDataSchema = z.array(comparisonSchema);
