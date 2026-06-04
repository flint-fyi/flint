import { RuleTester } from "@flint.fyi/rule-tester";
import { createRuleTesterTSConfig } from "@flint.fyi/typescript-language";
import { describe, it } from "vitest";

export const ruleTester = new RuleTester({
	assertNoLanguageReports: true,
	defaults: {
		fileName: "file.ts",
		files: createRuleTesterTSConfig({
			types: ["vitest/globals", "node"],
		}),
	},
	describe,
	diskBackedFSRoot: import.meta.dirname,
	it,
});
