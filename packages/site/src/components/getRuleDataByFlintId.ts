import {
	getFlintRuleId,
	ruleData,
	type RuleDetails,
} from "@flint.fyi/rule-data";

const ruleDataByFlintId = new Map(
	ruleData.map((ruleDetails) => [
		getFlintRuleId(ruleDetails.flint.plugin, ruleDetails.flint.name),
		ruleDetails,
	]),
);

export function getRuleDataByFlintId(
	pluginId: string,
	ruleId: string,
): RuleDetails {
	const flintRuleId = getFlintRuleId(pluginId, ruleId);
	const ruleDetails = ruleDataByFlintId.get(flintRuleId);

	if (!ruleDetails) {
		throw new Error(`Missing rule data for: ${flintRuleId}`);
	}

	return ruleDetails;
}
