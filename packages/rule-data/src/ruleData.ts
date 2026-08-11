import data from "./data.json" with { type: "json" };
import { ruleDataSchema, type RuleDetails } from "./schemas.ts";

export type LinterName = Exclude<keyof RuleDetails, "flint" | "notes">;

export function getFlintRuleId(pluginId: string, ruleId: string): string {
	return [pluginId, ruleId].join("/");
}

export const linterNames: Record<LinterName, string> = {
	biome: "Biome",
	deno: "Deno",
	eslint: "ESLint",
	markdownlint: "Markdownlint",
	oxlint: "Oxlint",
	stylelint: "Stylelint",
};

const ruleData: RuleDetails[] = ruleDataSchema.parse(data);

export { ruleData };
