import { describe, expect, it } from "vitest";

import {
	getPluginName,
	getRuleForPlugin,
	getRuleForPluginSafe,
} from "./getRuleForPlugin.ts";

describe(getPluginName, () => {
	it("returns the display name for a plugin ID", () => {
		expect(getPluginName("package-json")).toBe("PackageJSON");
		expect(getPluginName("ts")).toBe("TypeScript");
	});

	it("throws for an unknown plugin ID", () => {
		expect(() => getPluginName("unknown")).toThrow(
			"Unknown Flint plugin: unknown.",
		);
	});

	it("throws for an inherited object property", () => {
		expect(() => getPluginName("toString")).toThrow(
			"Unknown Flint plugin: toString.",
		);
	});
});

describe(getRuleForPlugin, () => {
	it("returns the rule for a plugin and rule ID", () => {
		expect(getRuleForPlugin("ts", "anyAssignments").about.id).toBe(
			"anyAssignments",
		);
	});

	it("throws for an inherited object property", () => {
		expect(() => getRuleForPlugin("toString", "anyAssignments")).toThrow(
			"Unknown Flint plugin: toString.",
		);
	});
});

describe(getRuleForPluginSafe, () => {
	it("returns undefined for an inherited object property", () => {
		expect(getRuleForPluginSafe("toString", "anyAssignments")).toBeUndefined();
	});
});
