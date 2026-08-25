import { createRuleTesterTSConfig } from "@flint.fyi/typescript-language";

import { ruleTester } from "./ruleTester.ts";
import rule from "./undefinedVariables.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
undefinedVar;
`,
			fileName: "file.js",
			files: createRuleTesterTSConfig({
				allowJs: true,
				checkJs: false,
				noEmit: true,
			}),
			snapshot: `
undefinedVar;
~~~~~~~~~~~~
Variable 'undefinedVar' is used but was never defined.
`,
		},
	],
	valid: [
		{
			code: `const value = 5; value;`,
			fileName: "file.js",
			files: createRuleTesterTSConfig({
				allowJs: true,
				checkJs: false,
				noEmit: true,
			}),
		},
		{
			code: `function test(parameter) { return parameter; } test(1);`,
			fileName: "file.js",
			files: createRuleTesterTSConfig({
				allowJs: true,
				checkJs: false,
				noEmit: true,
			}),
		},
		{
			code: `let count = 0; count++;`,
			fileName: "file.js",
			files: createRuleTesterTSConfig({
				allowJs: true,
				checkJs: false,
				noEmit: true,
			}),
		},
		{
			code: `const obj = { prop: 1 }; obj.prop;`,
			fileName: "file.js",
			files: createRuleTesterTSConfig({
				allowJs: true,
				checkJs: false,
				noEmit: true,
			}),
		},
		{
			code: `const obj = { prop: undefined }; const { prop } = obj; prop;`,
			fileName: "file.js",
			files: createRuleTesterTSConfig({
				allowJs: true,
				checkJs: false,
				noEmit: true,
			}),
		},
		{
			code: `function fn() { return 1; } fn();`,
			fileName: "file.js",
			files: createRuleTesterTSConfig({
				allowJs: true,
				checkJs: false,
				noEmit: true,
			}),
		},
		{
			code: `class MyClass {} const instance = new MyClass(); instance;`,
			fileName: "file.js",
			files: createRuleTesterTSConfig({
				allowJs: true,
				checkJs: false,
				noEmit: true,
			}),
		},
		{
			code: `import { value } from "module"; value;`,
			fileName: "file.js",
			files: {
				...createRuleTesterTSConfig({
					allowJs: true,
					checkJs: false,
					noEmit: true,
				}),
				"node_modules/module/index.d.ts": `
export const value: unknown;
`,
			},
		},
		{
			code: `const array = [1, 2, 3]; array.forEach(item => item);`,
			fileName: "file.js",
			files: createRuleTesterTSConfig({
				allowJs: true,
				checkJs: false,
				noEmit: true,
			}),
		},
	],
});
