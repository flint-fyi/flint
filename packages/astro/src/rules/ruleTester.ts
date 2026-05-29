import { RuleTester } from "@flint.fyi/rule-tester";
import { createRuleTesterTSConfig } from "@flint.fyi/typescript-language";
import { describe, it } from "vitest";

export const ruleTester = new RuleTester({
	assertNoLanguageReports: true,
	defaults: {
		fileName: "file.astro",
		files: {
			...createRuleTesterTSConfig({
				jsx: "preserve",
				lib: ["dom", "esnext"],
			}),
			"fixtures.d.ts": `
declare module "*.astro" {
	const Component: (props: Record<string, unknown>) => unknown;
	export default Component;
}

declare module "*.svelte" {
	const Component: (props: Record<string, unknown>) => unknown;
	export default Component;
}
`,
			"node_modules/astro/jsx-runtime.d.ts": `
export namespace JSX {
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
