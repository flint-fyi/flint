import { z } from "zod/v4";

const flintRulePluginSchema = z.union([
	z.literal("astro"),
	z.literal("browser"),
	z.literal("css"),
	z.literal("drizzle"),
	z.literal("flint"),
	z.literal("graphql"),
	z.literal("json"),
	z.literal("jest"),
	z.literal("jsx"),
	z.literal("md"),
	z.literal("next"),
	z.literal("node"),
	z.literal("nuxt"),
	z.literal("package-json"),
	z.literal("performance"),
	z.literal("playwright"),
	z.literal("qwik"),
	z.literal("react"),
	z.literal("react-native"),
	z.literal("security"),
	z.literal("solid"),
	z.literal("spelling"),
	z.literal("svelte"),
	z.literal("ts"),
	z.literal("vitest"),
	z.literal("vue"),
	z.literal("yaml"),
]);

const flintRulePresetSchema = z.union([
	z.literal("config"),
	z.literal("javascript"),
	z.literal("logical"),
	z.literal("none"),
	z.literal("security"),
	z.literal("sorting"),
	z.literal("stylistic"),
]);

const flintRuleReferenceSchema = z.union([
	z
		.object({
			name: z.string().min(1),
			plugin: flintRulePluginSchema,
			status: z.literal("skipped"),
		})
		.strict(),
	z
		.object({
			name: z.string().min(1),
			plugin: flintRulePluginSchema,
			preset: flintRulePresetSchema.optional(),
			status: z.literal(["implemented"]).optional(),
			strictness: z.literal("strict").optional(),
		})
		.strict(),
]);

export type FlintRuleReference = z.infer<typeof flintRuleReferenceSchema>;

const linterRuleReferenceSchema = z
	.object({
		name: z.string(),
		url: z.url(),
	})
	.strict();

export type Comparison = z.infer<typeof comparisonSchema>;

/** @internal */
export type LinterRuleReference = z.infer<typeof linterRuleReferenceSchema>;

const comparisonSchema = z
	.object({
		biome: z.array(linterRuleReferenceSchema).optional(),
		deno: z.array(linterRuleReferenceSchema).optional(),
		eslint: z.array(linterRuleReferenceSchema).optional(),
		flint: flintRuleReferenceSchema,
		markdownlint: z.array(linterRuleReferenceSchema).optional(),
		notes: z.string().optional(),
		oxlint: z.array(linterRuleReferenceSchema).optional(),
		stylelint: z.array(linterRuleReferenceSchema).optional(),
	})
	.strict();

export const comparisonsDataSchema = z.array(comparisonSchema);
