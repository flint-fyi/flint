import { createRuleTesterTSConfig } from "@flint.fyi/typescript-language";

import rule from "./exportUniqueNames.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
const a = 1;
const b = 2;
export { a };
export { a };
`,
			fileName: "file.js",
			files: createRuleTesterTSConfig({
				allowJs: true,
				checkJs: false,
				noEmit: true,
			}),
			snapshot: `
const a = 1;
const b = 2;
export { a };
export { a };
         ~
         Duplicate export 'a' found.
`,
		},
		{
			code: `
export const value = 1;
export { value };
`,
			fileName: "file.js",
			files: createRuleTesterTSConfig({
				allowJs: true,
				checkJs: false,
				noEmit: true,
			}),
			snapshot: `
export const value = 1;
export { value };
         ~~~~~
         Duplicate export 'value' found.
`,
		},
		{
			code: `
export function getValue() { return 1; }
const getValue2 = getValue;
export { getValue2 as getValue };
`,
			fileName: "file.js",
			files: createRuleTesterTSConfig({
				allowJs: true,
				checkJs: false,
				noEmit: true,
			}),
			snapshot: `
export function getValue() { return 1; }
const getValue2 = getValue;
export { getValue2 as getValue };
                      ~~~~~~~~
                      Duplicate export 'getValue' found.
`,
		},
	],
	valid: [
		{
			code: `export const a = 1;`,
			fileName: "file.js",
			files: createRuleTesterTSConfig({
				allowJs: true,
				checkJs: false,
				noEmit: true,
			}),
		},
		{
			code: `const a = 1; const b = 2; export { a, b };`,
			fileName: "file.js",
			files: createRuleTesterTSConfig({
				allowJs: true,
				checkJs: false,
				noEmit: true,
			}),
		},
		{
			code: `export function getValue() { return 1; }`,
			fileName: "file.js",
			files: createRuleTesterTSConfig({
				allowJs: true,
				checkJs: false,
				noEmit: true,
			}),
		},
		{
			code: `const a = 1; const b = 2; export { a }; export { b };`,
			fileName: "file.js",
			files: createRuleTesterTSConfig({
				allowJs: true,
				checkJs: false,
				noEmit: true,
			}),
		},
	],
});
