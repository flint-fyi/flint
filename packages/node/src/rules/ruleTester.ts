import { afterAll, describe, it } from "vitest";

import { RuleTester } from "@flint.fyi/rule-tester";
import { createRuleTesterTSConfig } from "@flint.fyi/typescript-language";

export const ruleTester = new RuleTester({
	afterAll,
	defaults: {
		fileName: "file.ts",
		files: createRuleTesterTSConfig({
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
