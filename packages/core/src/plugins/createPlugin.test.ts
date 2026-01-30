import { describe, expect, it, vi } from "vitest";
import z from "zod";

import { createLanguage } from "../languages/createLanguage.ts";
import { createPlugin } from "./createPlugin.ts";

const stubLanguage = createLanguage({
	about: { name: "Stub" },
	createFileFactory: vi.fn(),
	runFileVisitors: vi.fn(),
});

const stubMessages = { "": { primary: "", secondary: [], suggestions: [] } };

const ruleStandalone = stubLanguage.createRule({
	about: {
		description: "",
		id: "standalone",
		presets: ["first"],
	},
	messages: stubMessages,
	setup: vi.fn(),
});

const ruleWithOptionalOption = stubLanguage.createRule({
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
});
