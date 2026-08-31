import { createRuleTesterTSConfig } from "@flint.fyi/typescript-language";

import { ruleTester } from "./ruleTester.ts";
import rule from "./unsafeNegations.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
const key = "property";
const object = {};

!key in object;
`,
			fileName: "file.js",
			files: createRuleTesterTSConfig({
				allowJs: true,
				checkJs: false,
				noEmit: true,
			}),
			snapshot: `
const key = "property";
const object = {};

!key in object;
~
This negation applies before the \`in\` operator.
`,
		},
	],
	valid: [
		{
			code: `
const key = "property";
const object = {};

!(key in object);
`,
			fileName: "file.js",
			files: createRuleTesterTSConfig({
				allowJs: true,
				checkJs: false,
				noEmit: true,
			}),
		},
		{
			code: `
const object = new Date();
const Constructor = Date;

!(object instanceof Constructor);
`,
			fileName: "file.js",
			files: createRuleTesterTSConfig({
				allowJs: true,
				checkJs: false,
				noEmit: true,
			}),
		},
		{
			code: `
const key = "property";
const object = {};

key in object;
`,
			fileName: "file.js",
			files: createRuleTesterTSConfig({
				allowJs: true,
				checkJs: false,
				noEmit: true,
			}),
		},
		{
			code: `
const object = new Date();
const Constructor = Date;

object instanceof Constructor;
`,
			fileName: "file.js",
			files: createRuleTesterTSConfig({
				allowJs: true,
				checkJs: false,
				noEmit: true,
			}),
		},
		{
			code: `
const flag = false;
const key = "property";
const object = {};

!flag && key in object;
`,
			fileName: "file.js",
			files: createRuleTesterTSConfig({
				allowJs: true,
				checkJs: false,
				noEmit: true,
			}),
		},
	],
});
