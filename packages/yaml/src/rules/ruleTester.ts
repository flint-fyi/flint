import { describe, it } from "vitest";

import { RuleTester } from "@flint.fyi/rule-tester";

export const ruleTester = new RuleTester({
	defaults: { fileName: "file.yaml" },
	describe,
	it,
});
