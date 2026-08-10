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
			preset: flintRulePresetSchema.exactOptional(),
			status: z.literal(["implemented"]).exactOptional(),
			strictness: z.literal("strict").exactOptional(),
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

export type RuleDetails = z.infer<typeof ruleDetailsSchema>;

/** @internal */
export type LinterRuleReference = z.infer<typeof linterRuleReferenceSchema>;

const ruleDetailsSchema = z
	.object({
		biome: z.array(linterRuleReferenceSchema).exactOptional(),
		deno: z.array(linterRuleReferenceSchema).exactOptional(),
		eslint: z.array(linterRuleReferenceSchema).exactOptional(),
		flint: flintRuleReferenceSchema,
		markdownlint: z.array(linterRuleReferenceSchema).exactOptional(),
		notes: z.string().exactOptional(),
		oxlint: z.array(linterRuleReferenceSchema).exactOptional(),
		stylelint: z.array(linterRuleReferenceSchema).exactOptional(),
	})
	.strict();

export const ruleDataSchema = z.array(ruleDetailsSchema);
