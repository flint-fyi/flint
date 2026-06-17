import { createRuleTesterTSConfig } from "@flint.fyi/typescript-language";

import rule from "./objectKeyDuplicates.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
const object = { a: 1, a: 2 };
`,
			fileName: "file.js",
			files: createRuleTesterTSConfig({
				allowJs: true,
				checkJs: false,
				noEmit: true,
				noUnusedLocals: false,
			}),
			snapshot: `
const object = { a: 1, a: 2 };
                 ~
                 This key is made redundant by an identical key later in the object.
`,
		},
	],
	valid: [
		{
			code: `const object = {};`,
			files: createRuleTesterTSConfig({ noUnusedLocals: false }),
		},
		`const object = { a: 1 }; void object;`,
		`const object = { a: 1, b: 2 }; void object;`,
		`const object = { a: 1, b: 2, c: 3 }; void object;`,
		`const object = { "a": 1, "b": 2 }; void object;`,
		`const object = { 123: 1, 456: 2 }; void object;`,
		`
const spread = { b: 2 };
const object = { a: 1, ...spread };
void object;
`,
		`
const key: string = "key";
const object = { [key]: 1, [key]: 2 };
void object;
`,
		`
const a = 1;
const b = 2;
const object = { a, b };
void object;
`,
		`
const b = 2;
const object = { a: 1, b };
void object;
`,
		`const object = { method() { return 1; } }; void object;`,
		`const object = { get accessor() { return 1; } }; void object;`,
		`const object = { set accessor(value: number) { void value; } }; void object;`,
		`const object = { get accessor() { return 1; }, set accessor(value: number) { void value; } }; void object;`,
	],
});
