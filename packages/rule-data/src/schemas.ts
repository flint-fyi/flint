/* eslint perfectionist/sort-objects: ["error", {
	customGroups: [
		{
			groupName: "flint",
			elementNamePattern: "^flint$",
		},
		{
			groupName: "notes",
			elementNamePattern: "^notes$",
		},
	],
	groups: ["flint", "unknown", "notes"],
}] */

import { z } from "zod/v4";

type FlintPlugin =
	| "astro"
	| "browser"
	| "css"
	| "drizzle"
	| "flint"
	| "graphql"
	| "jest"
	| "json"
	| "jsx"
	| "md"
	| "next"
	| "node"
	| "nuxt"
	| "package-json"
	| "performance"
	| "playwright"
	| "qwik"
	| "react"
	| "react-native"
	| "security"
	| "solid"
	| "spelling"
	| "svelte"
	| "ts"
	| "vitest"
	| "vue"
	| "yaml";

const flintRulePluginSchema: z.ZodType<FlintPlugin> = z.union([
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

type FlintPreset =
	| "javascript"
	| "logical"
	| "security"
	| "sorting"
	| "stylistic";

const flintRulePresetSchema: z.ZodType<FlintPreset> = z.union([
	z.literal("javascript"),
	z.literal("logical"),
	z.literal("security"),
	z.literal("sorting"),
	z.literal("stylistic"),
]);

const flintRuleReferenceSchema: z.ZodType<FlintRuleReference> = z.union([
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

export type FlintRuleReference =
	| {
			name: string;
			plugin: FlintPlugin;
			preset?: FlintPreset;
			status?: "implemented";
			strictness?: "strict";
	  }
	| {
			name: string;
			plugin: FlintPlugin;
			status: "skipped";
	  };

const linterRuleReferenceSchema: z.ZodType<LinterRuleReference> = z
	.object({
		name: z.string(),
		url: z.url(),
	})
	.strict();

export interface LinterRuleReference {
	name: string;
	url: string;
}

export const linterNames = {
	biome: "Biome",
	deno: "Deno",
	eslint: "ESLint",
	markdownlint: "Markdownlint",
	oxlint: "Oxlint",
	stylelint: "Stylelint",
} as const;

export type LinterName = keyof typeof linterNames;

export interface RuleDetails extends AlternateLinterDetails {
	flint: FlintRuleReference;
	notes?: string;
}

type AlternateLinterDetails = Partial<
	Record<LinterName, LinterRuleReference[]>
>;

const ruleDetailsSchema: z.ZodType<RuleDetails> = z
	.object({
		flint: flintRuleReferenceSchema,
		biome: z.array(linterRuleReferenceSchema).exactOptional(),
		deno: z.array(linterRuleReferenceSchema).exactOptional(),
		eslint: z.array(linterRuleReferenceSchema).exactOptional(),
		markdownlint: z.array(linterRuleReferenceSchema).exactOptional(),
		oxlint: z.array(linterRuleReferenceSchema).exactOptional(),
		stylelint: z.array(linterRuleReferenceSchema).exactOptional(),
		notes: z.string().exactOptional(),
	})
	.strict();

export const ruleDataSchema: z.ZodType<RuleDetails[]> =
	z.array(ruleDetailsSchema);
