import { describe, expect, it } from "vitest";

import { getRuleAbouts } from "./getRuleAbouts.ts";
import { getFlintRuleId, ruleData } from "./index.ts";

const ruleAbouts = new Map(Object.entries(getRuleAbouts()));

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

		expect([...ruleAbouts.keys()].filter((id) => !ids.has(id))).toEqual([]);
	});

	it("should mark exactly the rules that exist as implemented", () => {
		const mismatches: string[] = [];

		for (const { flint } of ruleData) {
			const id = getFlintRuleId(flint.plugin, flint.name);
			const exists = ruleAbouts.has(id);

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

			const about = ruleAbouts.get(getFlintRuleId(flint.plugin, flint.name));
			if (!about) {
				continue;
			}

			const presets: readonly string[] = about.presets ?? [];
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
