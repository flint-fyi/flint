import { createRuleTesterTSConfig } from "@flint.fyi/typescript-language";

import rule from "./globalObjectCalls.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
const result = Math();
`,
			fileName: "file.js",
			files: createRuleTesterTSConfig({
				allowJs: true,
				checkJs: false,
				noEmit: true,
			}),
			snapshot: `
const result = Math();
               ~~~~
               Math is not a function and cannot be called directly.
`,
		},
		{
			code: `
const data = JSON();
`,
			fileName: "file.js",
			files: createRuleTesterTSConfig({
				allowJs: true,
				checkJs: false,
				noEmit: true,
			}),
			snapshot: `
const data = JSON();
             ~~~~
             JSON is not a function and cannot be called directly.
`,
		},
		{
			code: `
const reflected = Reflect();
`,
			fileName: "file.js",
			files: createRuleTesterTSConfig({
				allowJs: true,
				checkJs: false,
				noEmit: true,
			}),
			snapshot: `
const reflected = Reflect();
                  ~~~~~~~
                  Reflect is not a function and cannot be called directly.
`,
		},
		{
			code: `
const atomic = Atomics();
`,
			fileName: "file.js",
			files: createRuleTesterTSConfig({
				allowJs: true,
				checkJs: false,
				noEmit: true,
			}),
			snapshot: `
const atomic = Atomics();
               ~~~~~~~
               Atomics is not a function and cannot be called directly.
`,
		},
		{
			code: `
const instance = new Math();
`,
			fileName: "file.js",
			files: createRuleTesterTSConfig({
				allowJs: true,
				checkJs: false,
				noEmit: true,
			}),
			snapshot: `
const instance = new Math();
                     ~~~~
                     Math is not a function and cannot be called directly.
`,
		},
		{
			code: `
const instance = new JSON();
`,
			fileName: "file.js",
			files: createRuleTesterTSConfig({
				allowJs: true,
				checkJs: false,
				noEmit: true,
			}),
			snapshot: `
const instance = new JSON();
                     ~~~~
                     JSON is not a function and cannot be called directly.
`,
		},
		{
			code: `
const instance = new Reflect();
`,
			fileName: "file.js",
			files: createRuleTesterTSConfig({
				allowJs: true,
				checkJs: false,
				noEmit: true,
			}),
			snapshot: `
const instance = new Reflect();
                     ~~~~~~~
                     Reflect is not a function and cannot be called directly.
`,
		},
		{
			code: `
const instance = new Atomics();
`,
			fileName: "file.js",
			files: createRuleTesterTSConfig({
				allowJs: true,
				checkJs: false,
				noEmit: true,
			}),
			snapshot: `
const instance = new Atomics();
                     ~~~~~~~
                     Atomics is not a function and cannot be called directly.
`,
		},
	],
	valid: [
		`const value = Math.abs(-5); void value;`,
		`const parsed = JSON.parse("{}"); void parsed;`,
		`const stringified = JSON.stringify({}); void stringified;`,
		`const keys = Reflect.ownKeys({}); void keys;`,
		`const buffer = new Int32Array(1); const result = Atomics.add(buffer, 0, 1); void result;`,
	],
});
