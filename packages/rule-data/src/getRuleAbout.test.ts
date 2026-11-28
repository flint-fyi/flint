import { describe, expect, it } from "vitest";

import { getRuleAbout, getRuleAboutSafe } from "./getRuleAbout.ts";

describe(getRuleAbout, () => {
	it("returns the about data of a rule in a plugin with a different package name", () => {
		expect(getRuleAbout("flint", "pluginRuleOrdering")).toMatchObject({
			id: "pluginRuleOrdering",
			pluginId: "flint",
			presets: ["stylisticStrict"],
		});
	});

	it("throws for an unknown rule", () => {
		expect(() => getRuleAbout("ts", "notARule")).toThrow(
			"Unknown rule for ts: notARule.",
		);
	});
});

describe(getRuleAboutSafe, () => {
	it("returns the about data of a Vue rule", () => {
		expect(getRuleAboutSafe("vue", "vForKeys")?.description).toBe(
			"Reports v-for directives without a valid key binding.",
		);
	});

	it("returns undefined for an unknown plugin", () => {
		expect(getRuleAboutSafe("notAPlugin", "vForKeys")).toBeUndefined();
	});
});
