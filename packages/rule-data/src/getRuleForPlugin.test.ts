import { describe, expect, it } from "vitest";

import { getPluginName } from "./getRuleForPlugin.ts";

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
