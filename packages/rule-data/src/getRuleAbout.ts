import type { RuleAbout } from "@flint.fyi/core";

import { getRuleAbouts } from "./getRuleAbouts.ts" with { type: "macro" };
import { getFlintRuleId } from "./ruleData.ts";

const ruleAbouts: Partial<Record<string, RuleAbout>> = getRuleAbouts();

export function getRuleAbout(pluginId: string, ruleId: string): RuleAbout {
	const about = getRuleAboutSafe(pluginId, ruleId);

	if (!about) {
		throw new Error(`Unknown rule for ${pluginId}: ${ruleId}.`);
	}

	return about;
}

export function getRuleAboutSafe(
	pluginId: string,
	ruleId: string,
): RuleAbout | undefined {
	return ruleAbouts[getFlintRuleId(pluginId, ruleId)];
}
