import { astro } from "@flint.fyi/astro";
import { browser } from "@flint.fyi/browser";
import type { AnyRule } from "@flint.fyi/core";
import { css } from "@flint.fyi/css";
import { json } from "@flint.fyi/json";
import { jsx } from "@flint.fyi/jsx";
import { md } from "@flint.fyi/md";
import { node } from "@flint.fyi/node";
import { packageJson } from "@flint.fyi/package-json";
import { performance } from "@flint.fyi/performance";
import { flint } from "@flint.fyi/plugin-flint";
import { spelling } from "@flint.fyi/spelling";
import { ts } from "@flint.fyi/ts";
import { vitest } from "@flint.fyi/vitest";
import { yaml } from "@flint.fyi/yaml";

const plugins = {
	astro,
	browser,
	css,
	flint,
	json,
	jsx,
	md,
	node,
	"package-json": packageJson,
	performance,
	spelling,
	ts,
	vitest,
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

	return rule;
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

	return rule;
}
