import { describe, expect, it, vi } from "vitest";
import z from "zod/v4";

import { validateConfigDefinition } from "../configs/validateConfigDefinition.ts";
import { createLanguage } from "../languages/createLanguage.ts";
import { RuleCreator } from "../rules/RuleCreator.ts";
import { createPlugin } from "./createPlugin.ts";

const stubLanguage = createLanguage({
	about: { name: "Stub" },
	createFileFactory: vi.fn(),
	runFileVisitors: vi.fn(),
});

const stubMessages = { "": { primary: "", secondary: [], suggestions: [] } };

const ruleCreator = new RuleCreator({
	docs: (ruleId) => `https://flint.fyi/rules/stub/${ruleId.toLowerCase()}`,
	pluginId: "stub",
	presets: ["first", "second", "third"],
});

const ruleStandalone = ruleCreator.createRule(stubLanguage, {
	about: {
		description: "",
		id: "standalone",
		presets: ["first"],
	},
	messages: stubMessages,
	setup: vi.fn(),
});

const ruleWithOptionalOption = ruleCreator.createRule(stubLanguage, {
	about: {
		description: "",
		id: "withOptionalOption",
		presets: ["second"],
	},
	messages: stubMessages,
	options: {
		value: z.string().optional(),
	},
	setup: vi.fn(),
});

describe(createPlugin, () => {
	const plugin = createPlugin({
		name: "test",
		rules: [ruleStandalone, ruleWithOptionalOption],
	});

	describe("presets", () => {
		it("groups rules by about.presets when they exist", () => {
			expect(plugin.presets).toEqual({
				first: [ruleStandalone],
				second: [ruleWithOptionalOption],
			});
		});

		it("does not type unused presets", () => {
			expect(plugin.presets).not.toHaveProperty("third");
		});
	});

	describe("rules", () => {
		it("returns a rule with options when specified with an option", () => {
			const value = "abc";
			const rules = plugin.rules({
				withOptionalOption: { value },
			});

			expect(rules).toEqual([
				{
					options: { value },
					rule: ruleWithOptionalOption,
				},
			]);
		});
	});

	describe("rulesById", () => {
		it("stores rules by ID for keyed lookup", () => {
			expect(plugin.rulesById.standalone).toBe(ruleStandalone);
			expect(plugin.rulesById.withOptionalOption).toBe(ruleWithOptionalOption);
		});
	});

	describe(validateConfigDefinition, () => {
		it("reports nested undefined rules instead of allowing a runtime crash", () => {
			const error = validateConfigDefinition(
				{
					// @ts-expect-error -- Unused presets aren't guaranteed to exist at runtime.
					use: [{ files: "**/*.ts", rules: [plugin.presets.third] }],
				},
				"flint.config.ts",
			);

			expect(error).toContain("Invalid configuration in flint.config.ts");
			expect(error).toContain("at use[0]");
		});
	});
});
