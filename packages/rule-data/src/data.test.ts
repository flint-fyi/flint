import { describe, expect, it } from "vitest";

import { astro } from "@flint.fyi/astro";
import { browser } from "@flint.fyi/browser";
import { changesets } from "@flint.fyi/changesets";
import type { AnyRule } from "@flint.fyi/core";
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

import { getFlintRuleId, ruleData } from "./index.ts";

const rulesById = new Map<string, AnyRule>(
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
			rule,
		]),
	),
);

function isBasePreset(preset: string, presets: readonly string[]): boolean {
	return (
		presets.includes(preset) &&
		!(
			preset.endsWith("Strict") &&
			presets.includes(preset.slice(0, -"Strict".length))
		)
	);
}

describe("data.json", () => {
	it("should not include any duplicate Flint rules", () => {
		const seenIds = new Set<string>();
		const duplicates: string[] = [];

		for (const ruleDetails of ruleData) {
			const id = getFlintRuleId(
				ruleDetails.flint.plugin,
				ruleDetails.flint.name,
			);

			if (seenIds.has(id)) {
				duplicates.push(id);
			} else {
				seenIds.add(id);
			}

			expect(duplicates).toEqual([]);
		}
	});

	it("should include an entry for every rule", () => {
		const ids = new Set(
			ruleData.map(({ flint }) => getFlintRuleId(flint.plugin, flint.name)),
		);

		expect([...rulesById.keys()].filter((id) => !ids.has(id))).toEqual([]);
	});

	it("should mark exactly the rules that exist as implemented", () => {
		const mismatches: string[] = [];

		for (const { flint } of ruleData) {
			const id = getFlintRuleId(flint.plugin, flint.name);
			const exists = rulesById.has(id);

			if (exists && flint.status !== "implemented") {
				mismatches.push(`${id}: rule exists but is not marked implemented`);
			} else if (!exists && flint.status === "implemented") {
				mismatches.push(`${id}: marked implemented but no rule exists`);
			}
		}

		expect(mismatches).toEqual([]);
	});

	it("should list each implemented rule's base preset", () => {
		const mismatches: string[] = [];

		for (const { flint } of ruleData) {
			if (flint.status === "skipped") {
				continue;
			}

			const rule = rulesById.get(getFlintRuleId(flint.plugin, flint.name));
			if (!rule) {
				continue;
			}

			const presets: readonly string[] = rule.about.presets ?? [];
			const expected = presets.find((preset) => isBasePreset(preset, presets));
			const valid =
				flint.preset === undefined
					? expected === undefined
					: isBasePreset(flint.preset, presets);

			if (!valid) {
				mismatches.push(
					`${getFlintRuleId(flint.plugin, flint.name)}: expected ${expected ?? "no preset"}, found ${flint.preset ?? "no preset"}`,
				);
			}
		}

		expect(mismatches).toEqual([]);
	});
});
