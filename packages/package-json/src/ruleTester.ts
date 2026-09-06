import { afterAll, describe, it } from "vitest";

import { RuleTester } from "@flint.fyi/rule-tester";

export const ruleTester = new RuleTester({
	afterAll,
	defaults: { fileName: "package.json" },
	describe,
	it,
});
