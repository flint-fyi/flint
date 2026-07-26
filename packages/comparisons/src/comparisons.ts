import data from "./data.json" with { type: "json" };
import { comparisonsDataSchema, type Comparison } from "./schemas.ts";

export type LinterName =
	| "biome"
	| "deno"
	| "eslint"
	| "markdownlint"
	| "oxlint"
	| "stylelint";

export function getComparisonId(pluginId: string, ruleId: string) {
	return [pluginId, ruleId].join("/");
}

export const linterNames = {
	biome: "Biome",
	deno: "Deno",
	eslint: "ESLint",
	markdownlint: "Markdownlint",
	oxlint: "Oxlint",
	stylelint: "Stylelint",
} as const satisfies Record<LinterName, string>;

const comparisons: Comparison[] = comparisonsDataSchema.parse(data);

export { comparisons };
