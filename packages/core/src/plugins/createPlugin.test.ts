import { describe, expect, expectTypeOf, it, vi } from "vitest";
import z from "zod/v4";

import { createLanguage } from "../languages/createLanguage.ts";
import { RuleCreator } from "../rules/RuleCreator.ts";
import type { AnyLanguage } from "../types/languages.ts";
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
			expectTypeOf(plugin.presets).not.toHaveProperty("third");
		});

		// eslint-disable-next-line vitest/expect-expect
		it("types rule about properties exactly", () => {
			ruleCreator.createRule(stubLanguage, {
				about: {
					description: "",
					id: "withInvalidPresetProperty",
					// @ts-expect-error -- Rule about metadata must use presets, not preset.
					preset: "first",
				},
				messages: stubMessages,
				setup: vi.fn(),
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

		it("types rule settings according to each rule's options", () => {
			expectTypeOf(plugin.rules).toBeCallableWith({
				standalone: true,
				withOptionalOption: { value: "abc" },
			});

			// @ts-expect-error -- Rules without options can only be configured with booleans.
			plugin.rules({ standalone: { value: "abc" } });

			// @ts-expect-error -- Rule option values must match the rule's schema.
			plugin.rules({ withOptionalOption: { value: 123 } });
		});

		it("erases language internals from public rules", () => {
			expectTypeOf(ruleStandalone.language).toEqualTypeOf<AnyLanguage>();
		});
	});
});
