import type { StandardSchemaV1 } from "@standard-schema/spec";
import { describe, expectTypeOf, it, vi } from "vitest";
import z from "zod/v4";

import { createLanguage } from "../languages/createLanguage.ts";
import type { AnyLanguage } from "../types/languages.ts";
import type { AnyRule } from "../types/rules.ts";
import { RuleCreator } from "./RuleCreator.ts";

const language = createLanguage({
	about: { name: "Stub" },
	createFileFactory: vi.fn(),
	runFileVisitors: vi.fn(),
});

const ruleCreator = new RuleCreator({
	docs: (ruleId) => `https://flint.fyi/rules/stub/${ruleId.toLowerCase()}`,
	pluginId: "stub",
	presets: ["first"],
});

describe(RuleCreator, () => {
	it("preserves declared metadata without accepting misspelled properties", () => {
		const rule = ruleCreator.createRule(language, {
			about: { description: "", id: "example", presets: ["first"] },
			messages: {},
			setup: vi.fn(),
		});

		expectTypeOf(rule.about.presets).toEqualTypeOf<readonly ["first"]>();

		ruleCreator.createRule(language, {
			about: {
				description: "",
				id: "example",
				// @ts-expect-error -- Rule metadata accepts presets, not preset.
				preset: "first",
			},
			messages: {},
			setup: vi.fn(),
		});
	});

	it("accepts optional Standard Schemas but rejects required options", () => {
		const schema: StandardSchemaV1<string | undefined, string> = {
			"~standard": {
				validate: (value) =>
					typeof value === "string" || value === undefined
						? { value: value ?? "default" }
						: { issues: [{ message: "Expected a string." }] },
				vendor: "test",
				version: 1,
			},
		};
		const rule = ruleCreator.createRule(language, {
			about: { description: "", id: "example" },
			messages: {},
			options: { value: schema },
			setup: vi.fn(),
		});

		expectTypeOf(rule).toExtend<AnyRule>();

		ruleCreator.createRule(language, {
			about: { description: "", id: "example" },
			messages: {},
			options: {
				// @ts-expect-error -- Rules must be usable without configuring options.
				value: z.string(),
			},
			setup: vi.fn(),
		});
	});

	it("returns rules without exposing language internals", () => {
		const rule = ruleCreator.createRule(language, {
			about: { description: "", id: "example" },
			messages: {},
			setup: vi.fn(),
		});

		expectTypeOf(rule.language).toEqualTypeOf<AnyLanguage>();
	});
});
