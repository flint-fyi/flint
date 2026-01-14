import { browser } from "@flint.fyi/plugin-browser";
import { flint } from "@flint.fyi/plugin-flint";
import { jsx } from "@flint.fyi/plugin-jsx";
import { node } from "@flint.fyi/plugin-node";
import { performance } from "@flint.fyi/plugin-performance";
import { spelling } from "@flint.fyi/plugin-spelling";
import { type AnyRule, json, md, ts, yaml } from "flint";

const plugins = {
	browser,
	flint,
	json,
	jsx,
	md,
	node,
	performance,
	spelling,
	ts,
	yaml,
};

export function getRuleForPlugin(pluginId: string, ruleId: string): AnyRule {
	if (!(pluginId in plugins)) {
		throw new Error(`Unknown Flint plugin: ${pluginId}.`);
	}

	const plugin = plugins[pluginId as keyof typeof plugins];
	const rule = plugin.rulesById.get(ruleId);

	if (!rule) {
		throw new Error(`Unknown rule for ${pluginId}: ${ruleId}.`);
	}

	return rule as AnyRule;
}

export function getRuleForPluginSafe(
	pluginId: string,
	ruleId: string,
): AnyRule | undefined {
	if (!(pluginId in plugins)) {
		return undefined;
	}

	const plugin = plugins[pluginId as keyof typeof plugins];
	const rule = plugin.rulesById.get(ruleId);

	if (!rule) {
		return undefined;
	}

	return rule as AnyRule;
}
