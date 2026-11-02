import { describe, it } from "vitest";

import { RuleTester } from "@flint.fyi/rule-tester";
import { createRuleTesterTSConfig } from "@flint.fyi/typescript-language";

export const ruleTester = new RuleTester({
	defaults: {
		fileName: "file.ts",
		files: createRuleTesterTSConfig(),
	},
	describe,
	diskBackedFSRoot: import.meta.dirname,
	it,
});

export const scriptRuleTester = new RuleTester({
	defaults: {
		fileName: "file.ts",
		files: createRuleTesterTSConfig({
			moduleDetection: "auto",
		}),
	},
	describe,
	diskBackedFSRoot: import.meta.dirname,
	it,
});

export const domLibRuleTester = new RuleTester({
	defaults: {
		fileName: "file.ts",
		files: createRuleTesterTSConfig({
			lib: ["esnext", "dom"],
		}),
	},
	describe,
	diskBackedFSRoot: import.meta.dirname,
	it,
});

export const javascriptRuleTester = new RuleTester({
	defaults: {
		fileName: "file.js",
		files: createRuleTesterTSConfig({
			allowJs: true,
			checkJs: false,
			noEmit: true,
			noUnusedLocals: false,
		}),
	},
	describe,
	diskBackedFSRoot: import.meta.dirname,
	it,
});

export const jsxRuleTester = new RuleTester({
	defaults: {
		fileName: "file.tsx",
		files: createRuleTesterTSConfig({ jsx: "preserve" }),
	},
	describe,
	diskBackedFSRoot: import.meta.dirname,
	it,
});
