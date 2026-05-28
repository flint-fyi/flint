import { z } from "zod/v4";

const linterNames = [
	"biome",
	"deno",
	"eslint",
	"markdownlint",
	"oxlint",
	"stylelint",
];

export const linterNameSchema = z.union(
	linterNames.map((linterName) => z.literal(linterName)),
);

export type LinterName = z.infer<typeof linterNameSchema>;

const flintRuleStatusSchema = z.union([
	z.literal("implemented"),
	z.literal("skipped"),
]);

const flintRuleReferenceSchema = z.object({
	name: linterNameSchema,
	plugin: z.string(),
	preset: z.string(),
	status: flintRuleStatusSchema.optional(),
	strictness: z.string().optional(),
});

export type FlintRuleReference = z.infer<typeof flintRuleReferenceSchema>;

const linterRuleReferenceSchema = z.object({
	name: z.string(),
	url: z.string(),
});

export const comparisonSchema = z.object({
	...Object.fromEntries(
		linterNames.map((linterName) => [
			linterName,
			z.array(linterRuleReferenceSchema).optional(),
		]),
	),
	flint: flintRuleReferenceSchema,
	notes: z.string().optional(),
});

export type Comparison = z.infer<typeof comparisonSchema>;

export const comparisonsDataSchema = z.array(comparisonSchema);
