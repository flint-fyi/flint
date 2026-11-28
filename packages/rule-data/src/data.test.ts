import { describe, expect, it } from "vitest";

import { getFlintRuleId, getRuleForPluginSafe, ruleData } from "./index.ts";

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

	it("should list each implemented rule's base preset", () => {
		const mismatches: string[] = [];

		for (const { flint } of ruleData) {
			if (flint.status === "skipped") {
				continue;
			}

			const rule = getRuleForPluginSafe(flint.plugin, flint.name);
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
