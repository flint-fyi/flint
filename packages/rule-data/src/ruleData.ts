import data from "./data.json" with { type: "json" };
import { ruleDataSchema } from "./schemas.ts";

export type LinterName =
	| "biome"
	| "deno"
	| "eslint"
	| "markdownlint"
	| "oxlint"
	| "stylelint";

export function getFlintRuleId(pluginId: string, ruleId: string): string {
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

const ruleData = ruleDataSchema.parse(data);

export { ruleData };
