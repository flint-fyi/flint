import { ruleTester } from "./ruleTester.ts";
import rule from "./selfAssignments.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
let value = 0;
value = value;
`,
			snapshot: `
let value = 0;
value = value;
~~~~~~~~~~~~~
This value is being assigned to itself, which does nothing.
`,
		},
		{
			code: `
let count = 0;
count &&= count;
`,
			snapshot: `
let count = 0;
count &&= count;
~~~~~~~~~~~~~~~
This value is being assigned to itself, which does nothing.
`,
		},
		{
			code: `
let flag = false;
flag ||= flag;
`,
			snapshot: `
let flag = false;
flag ||= flag;
~~~~~~~~~~~~~
This value is being assigned to itself, which does nothing.
`,
		},
		{
			code: `
let data: number | undefined = undefined;
data ??= data;
`,
			snapshot: `
let data: number | undefined = undefined;
data ??= data;
~~~~~~~~~~~~~
This value is being assigned to itself, which does nothing.
`,
		},
		{
			code: `
const a: { b: number | undefined } = { b: undefined };
a.b ??= a.b;
`,
			snapshot: `
const a: { b: number | undefined } = { b: undefined };
a.b ??= a.b;
~~~~~~~~~~~
This value is being assigned to itself, which does nothing.
`,
		},
	],
	valid: [
		`
let value = 0;
const other = 1;
value = other;
`,
		`
let first = 0;
const second = 1;
first = second;
`,
		`var value: number | undefined = value;`,
		`var data: number | undefined = data;`,
		`
let value = 0;
value += value;
`,
		`
let count = 0;
count -= count;
`,
		`
let a = false;
const b = true;
a ||= b;
`,
		`
const a: { b: number | undefined; c: number } = { b: undefined, c: 1 };
a.b ||= a.c;
`,
	],
});
