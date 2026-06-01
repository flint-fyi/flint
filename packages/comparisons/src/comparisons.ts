import data from "./data.json" with { type: "json" };
import type { Comparison, LinterName } from "./schemas.ts";

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

const comparisons = data as Comparison[];

export { comparisons };
