import { describe, it } from "vitest";

import type { AnyRule, AnyRuleDefinition, Rule } from "./rules.ts";

describe("Rule", () => {
	it("should be assignable to AnyRule", () => {
		const rule = {} as Rule<
			{
				description: "desc";
				id: "id";
			},
			{ bar: "bar" },
			{ bar: "bar" },
			"message",
			undefined
		>;

		const fn = (r: AnyRule) => r;

		fn(rule);
	});

	it("should be assignable to AnyRuleDefinition", () => {
		const rule = {} as Rule<
			{
				description: "desc";
				id: "id";
			},
			{ bar: "bar" },
			{ bar: "bar" },
			"message",
			undefined
		>;

		const fn = (r: AnyRuleDefinition) => r;

		fn(rule);
	});
});
