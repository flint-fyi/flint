import { RuleTester } from "@flint.fyi/rule-tester";
import { describe, it } from "vitest";

export const ruleTester = new RuleTester({
	defaults: { fileName: "file.json" },
	describe,
	it,
});
