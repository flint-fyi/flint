import { describe, expect, it } from "vitest";

import {
	createNativeScenarioFiles,
	nativeScenarios,
} from "./nativeScenarios.ts";

describe("native timing scenarios", () => {
	it.each(nativeScenarios)("creates a package file for $label", (scenario) => {
		expect(createNativeScenarioFiles(scenario)["package.json"]).toEqual([
			'{"type":"module"}',
			"json",
		]);
	});

	it.each(["astro", "svelte", "vue"] as const)(
		"creates a runnable %s project",
		(language) => {
			const scenario = nativeScenarios.find(({ slug }) => slug === language);

			if (!scenario) {
				throw new Error(`Missing ${language} scenario.`);
			}

			expect(Object.keys(createNativeScenarioFiles(scenario))).toEqual([
				"flint.config.ts",
				"package.json",
				"src",
				"tsconfig.json",
			]);
			expect(
				Object.keys(createNativeScenarioFiles(scenario).src ?? {}),
			).toHaveLength(128);
			expect(
				Object.values(createNativeScenarioFiles(scenario).src ?? {}).every(
					(file) => Array.isArray(file) && file[1] === "html",
				),
			).toBe(true);
		},
	);
});
