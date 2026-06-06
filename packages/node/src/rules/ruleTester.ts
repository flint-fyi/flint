import { RuleTester } from "@flint.fyi/rule-tester";
import { createRuleTesterTSConfig } from "@flint.fyi/typescript-language";
import { describe, it } from "vitest";

export const ruleTester = new RuleTester({
	assertNoLanguageReports: true,
	defaults: {
		fileName: "file.ts",
		files: createRuleTesterTSConfig({
			esModuleInterop: false,
			module: "preserve",
			types: ["node"],
			// TODO: remove this; there is a bug in blobReadingMethods - it doesn't respect type from @types/node
			lib: ["esnext", "dom"],
		}),
	},
	describe,
	diskBackedFSRoot: import.meta.dirname,
	it,
});
