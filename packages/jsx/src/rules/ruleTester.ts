import { describe, it } from "vitest";

import { RuleTester } from "@flint.fyi/rule-tester";
import { createRuleTesterTSConfig } from "@flint.fyi/typescript-language";

export const ruleTester = new RuleTester({
	defaults: {
		fileName: "file.tsx",
		files: {
			...createRuleTesterTSConfig({
				jsx: "preserve",
				lib: ["dom", "esnext"],
			}),
			"jsx.d.ts": `
declare namespace JSX {
	interface IntrinsicElements {
		[name: string]: Record<string, unknown>;
	}
}
`,
		},
	},
	describe,
	diskBackedFSRoot: import.meta.dirname,
	it,
});
