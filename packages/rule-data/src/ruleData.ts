import data from "./data.json" with { type: "json" };
import { ruleDataSchema, type RuleDetails } from "./schemas.ts";

export function getFlintRuleId(pluginId: string, ruleId: string): string {
	return [pluginId, ruleId].join("/");
}

const ruleData: RuleDetails[] = ruleDataSchema.parse(data);

export { ruleData };
