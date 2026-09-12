import { afterAll, describe, it } from "vitest";

import { RuleTester } from "@flint.fyi/rule-tester";

export const ruleTester = new RuleTester({
	afterAll,
	defaults: { fileName: "package.json" },
	describe,
	it,
});

export const repositoryRootRuleTester = new RuleTester({
	afterAll,
	defaults: { fileName: "package.json" },
	describe,
	diskBackedFSRoot: import.meta.dirname,
	it,
});
