import { RuleTester } from "@flint.fyi/rule-tester";
import { createRuleTesterTSConfig } from "@flint.fyi/typescript-language";
import { describe, it } from "vitest";

export const ruleTester = new RuleTester({
	defaults: {
		fileName: "file.ts",
		files: createRuleTesterTSConfig({
			// TODO: use per-test-case tsconfig.json instead -- https://github.com/flint-fyi/flint/issues/621
			lib: ["esnext", "dom"],
		}),
	},
	describe,
	diskBackedFSRoot: import.meta.dirname,
	it,
});
