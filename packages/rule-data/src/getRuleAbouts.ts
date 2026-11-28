import { astro } from "@flint.fyi/astro";
import { browser } from "@flint.fyi/browser";
import { changesets } from "@flint.fyi/changesets";
import type { RuleAbout } from "@flint.fyi/core";
import { css } from "@flint.fyi/css";
import { json } from "@flint.fyi/json";
import { jsx } from "@flint.fyi/jsx";
import { md } from "@flint.fyi/md";
import { next } from "@flint.fyi/next";
import { node } from "@flint.fyi/node";
import { nuxt } from "@flint.fyi/nuxt";
import { packageJson } from "@flint.fyi/package-json";
import { performance } from "@flint.fyi/performance";
import { flint } from "@flint.fyi/plugin-flint";
import { react } from "@flint.fyi/react";
import { solid } from "@flint.fyi/solid";
import { spelling } from "@flint.fyi/spelling";
import { svelte } from "@flint.fyi/svelte";
import { ts } from "@flint.fyi/ts";
import { vitest } from "@flint.fyi/vitest";
import { vue } from "@flint.fyi/vue";
import { yaml } from "@flint.fyi/yaml";

import { getFlintRuleId } from "./ruleData.ts";

export function getRuleAbouts(): Record<string, RuleAbout> {
	return Object.fromEntries(
		Object.entries({
			astro,
			browser,
			changesets,
			css,
			flint,
			json,
			jsx,
			md,
			next,
			node,
			nuxt,
			"package-json": packageJson,
			performance,
			react,
			solid,
			spelling,
			svelte,
			ts,
			vitest,
			vue,
			yaml,
		}).flatMap(([pluginId, plugin]) =>
			[...plugin.rulesById].map(([ruleId, rule]) => [
				getFlintRuleId(pluginId, ruleId),
				rule.about,
			]),
		),
	);
}
