import { RuleTester } from "@flint.fyi/rule-tester";
import { createRuleTesterTSConfig } from "@flint.fyi/typescript-language";
import { describe, it } from "vitest";

export const ruleTester = new RuleTester({
	assertNoLanguageReports: true,
	defaults: {
		fileName: "file.vue",
		files: createRuleTesterTSConfig({
			jsx: "preserve",
			jsxImportSource: "vue",
			lib: ["dom", "esnext"],
		}),
	},
	describe,
	diskBackedFSRoot: import.meta.dirname,
	it,
});
