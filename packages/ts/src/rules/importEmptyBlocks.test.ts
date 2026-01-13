import rule from "./importEmptyBlocks.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
import { } from "mod";
`,
			snapshot: `
import { } from "mod";
       ~~~
       Empty named import blocks are unnecessary.
`,
		},
		{
			code: `
import {  } from "mod";
`,
			snapshot: `
import {  } from "mod";
       ~~~~
       Empty named import blocks are unnecessary.
`,
		},
		{
			code: `
import Default, { } from "mod";
`,
			snapshot: `
import Default, { } from "mod";
                ~~~
                Empty named import blocks are unnecessary.
`,
		},
		{
			code: `
import type { } from "mod";
`,
			snapshot: `
import type { } from "mod";
            ~~~
            Empty named import blocks are unnecessary.
`,
		},
		{
			code: `
import type Default, { } from "mod";
`,
			snapshot: `
import type Default, { } from "mod";
                     ~~~
                     Empty named import blocks are unnecessary.
`,
		},
	],
	valid: [
		`import { named } from "mod";`,
		`import Default, { named } from "mod";`,
		`import Default from "mod";`,
		`import * as mod from "mod";`,
		`import "mod";`,
		`import type { Type } from "mod";`,
	],
});
