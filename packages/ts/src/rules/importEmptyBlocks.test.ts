import rule from "./importEmptyBlocks.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
import { } from "mod";
`,
			output: `
import "mod";
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
			output: `
import "mod";
`,
			snapshot: `
import {  } from "mod";
       ~~~~
       Empty named import blocks are unnecessary.
`,
		},
		{
			code: `
import {} from "mod";
`,
			output: `
import "mod";
`,
			snapshot: `
import {} from "mod";
       ~~
       Empty named import blocks are unnecessary.
`,
		},
		{
			code: `
import Default, { } from "mod";
`,
			output: `
import Default from "mod";
`,
			snapshot: `
import Default, { } from "mod";
                ~~~
                Empty named import blocks are unnecessary.
`,
		},
		{
			code: `
import Default, {} from "mod";
`,
			output: `
import Default from "mod";
`,
			snapshot: `
import Default, {} from "mod";
                ~~
                Empty named import blocks are unnecessary.
`,
		},
		{
			code: `
import Default, {  } from "mod";
`,
			output: `
import Default from "mod";
`,
			snapshot: `
import Default, {  } from "mod";
                ~~~~
                Empty named import blocks are unnecessary.
`,
		},
		{
			code: `
import type { } from "mod";
`,
			output: `
import "mod";
`,
			snapshot: `
import type { } from "mod";
            ~~~
            Empty named import blocks are unnecessary.
`,
		},
		{
			code: `
import type {} from "mod";
`,
			output: `
import "mod";
`,
			snapshot: `
import type {} from "mod";
            ~~
            Empty named import blocks are unnecessary.
`,
		},
		{
			code: `
import type Default, { } from "mod";
`,
			output: `
import type Default from "mod";
`,
			snapshot: `
import type Default, { } from "mod";
                     ~~~
                     Empty named import blocks are unnecessary.
`,
		},
		{
			code: `
import type Default, {} from "mod";
`,
			output: `
import type Default from "mod";
`,
			snapshot: `
import type Default, {} from "mod";
                     ~~
                     Empty named import blocks are unnecessary.
`,
		},
		{
			code: `
import { } from "@scope/package";
`,
			output: `
import "@scope/package";
`,
			snapshot: `
import { } from "@scope/package";
       ~~~
       Empty named import blocks are unnecessary.
`,
		},
		{
			code: `
import { } from "./relative-path";
`,
			output: `
import "./relative-path";
`,
			snapshot: `
import { } from "./relative-path";
       ~~~
       Empty named import blocks are unnecessary.
`,
		},
		{
			code: `
import {
} from "mod";
`,
			output: `
import "mod";
`,
			snapshot: `
import {
       ~
       Empty named import blocks are unnecessary.
} from "mod";
~
`,
		},
		{
			code: `
import Default, {
} from "mod";
`,
			output: `
import Default from "mod";
`,
			snapshot: `
import Default, {
                ~
                Empty named import blocks are unnecessary.
} from "mod";
~
`,
		},
		{
			code: `
import Default /* hello, world */ , { } from "mod";
`,
			output: `
import Default /* hello, world */  from "mod";
`,
			snapshot: `
import Default /* hello, world */ , { } from "mod";
                                    ~~~
                                    Empty named import blocks are unnecessary.
`,
		},
		{
			code: `
import Default /* a, b, c */ , {} from "mod";
`,
			output: `
import Default /* a, b, c */  from "mod";
`,
			snapshot: `
import Default /* a, b, c */ , {} from "mod";
                               ~~
                               Empty named import blocks are unnecessary.
`,
		},
		{
			code: `
import Default /* , */ , { } from "mod";
`,
			output: `
import Default /* , */  from "mod";
`,
			snapshot: `
import Default /* , */ , { } from "mod";
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
		`import type Default from "mod";`,
		`import type * as Types from "mod";`,
		`import { a, b, c } from "mod";`,
		`import Default, { a, b } from "mod";`,
		`import type { TypeA, TypeB } from "mod";`,
	],
});
