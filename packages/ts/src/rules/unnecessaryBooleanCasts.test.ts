import { ruleTester } from "./ruleTester.ts";
import rule from "./unnecessaryBooleanCasts.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
declare let value: unknown;
if (!!value) {}
`,
			output: `
declare let value: unknown;
if (value) {}
`,
			snapshot: `
declare let value: unknown;
if (!!value) {}
    ~~~~~~~
    Casting this value to a boolean is unnecessary in this context.
`,
		},
		{
			code: `
declare let condition: unknown;
while (!!condition) {}
`,
			output: `
declare let condition: unknown;
while (condition) {}
`,
			snapshot: `
declare let condition: unknown;
while (!!condition) {}
       ~~~~~~~~~~~
       Casting this value to a boolean is unnecessary in this context.
`,
		},
		{
			code: `
declare let flag: unknown;
const result = !!flag ? "yes" : "no";
`,
			output: `
declare let flag: unknown;
const result = flag ? "yes" : "no";
`,
			snapshot: `
declare let flag: unknown;
const result = !!flag ? "yes" : "no";
               ~~~~~~
               Casting this value to a boolean is unnecessary in this context.
`,
		},
		{
			code: `
declare let value: unknown;
if (Boolean(value)) {}
`,
			output: `
declare let value: unknown;
if (value) {}
`,
			snapshot: `
declare let value: unknown;
if (Boolean(value)) {}
    ~~~~~~~~~~~~~~
    Casting this value to a boolean is unnecessary in this context.
`,
		},
		{
			code: `
declare let condition: unknown;
while (Boolean(condition)) {}
`,
			output: `
declare let condition: unknown;
while (condition) {}
`,
			snapshot: `
declare let condition: unknown;
while (Boolean(condition)) {}
       ~~~~~~~~~~~~~~~~~~
       Casting this value to a boolean is unnecessary in this context.
`,
		},
		{
			code: `
declare let active: unknown;
do {} while (!!active);
`,
			output: `
declare let active: unknown;
do {} while (active);
`,
			snapshot: `
declare let active: unknown;
do {} while (!!active);
             ~~~~~~~~
             Casting this value to a boolean is unnecessary in this context.
`,
		},
		{
			code: `
declare let running: unknown;
for (; !!running;) {}
`,
			output: `
declare let running: unknown;
for (; running;) {}
`,
			snapshot: `
declare let running: unknown;
for (; !!running;) {}
       ~~~~~~~~~
       Casting this value to a boolean is unnecessary in this context.
`,
		},
		{
			code: `
declare let value: unknown;
declare function fn(value: unknown): unknown;
if (Boolean(fn?.(value))) {}
`,
			output: `
declare let value: unknown;
declare function fn(value: unknown): unknown;
if (fn?.(value)) {}
`,
			snapshot: `
declare let value: unknown;
declare function fn(value: unknown): unknown;
if (Boolean(fn?.(value))) {}
    ~~~~~~~~~~~~~~~~~~~~
    Casting this value to a boolean is unnecessary in this context.
`,
		},
		{
			code: `
declare let value: unknown;
declare let other: unknown;
if (!!(value && other)) {}
`,
			output: `
declare let value: unknown;
declare let other: unknown;
if ((value && other)) {}
`,
			snapshot: `
declare let value: unknown;
declare let other: unknown;
if (!!(value && other)) {}
    ~~~~~~~~~~~~~~~~~~
    Casting this value to a boolean is unnecessary in this context.
`,
		},
		{
			code: `
declare let value: unknown;
declare let left: unknown;
declare let right: unknown;
if (!!(value ? left : right)) {}
`,
			output: `
declare let value: unknown;
declare let left: unknown;
declare let right: unknown;
if ((value ? left : right)) {}
`,
			snapshot: `
declare let value: unknown;
declare let left: unknown;
declare let right: unknown;
if (!!(value ? left : right)) {}
    ~~~~~~~~~~~~~~~~~~~~~~~~
    Casting this value to a boolean is unnecessary in this context.
`,
		},
		{
			code: `
declare let value: unknown;
declare let other: unknown;
if (Boolean(value && other)) {}
`,
			output: `
declare let value: unknown;
declare let other: unknown;
if (value && other) {}
`,
			snapshot: `
declare let value: unknown;
declare let other: unknown;
if (Boolean(value && other)) {}
    ~~~~~~~~~~~~~~~~~~~~~~~
    Casting this value to a boolean is unnecessary in this context.
`,
		},
		{
			code: `
declare let value: unknown;
declare let other: unknown;
if (!!(value = other)) {}
`,
			output: `
declare let value: unknown;
declare let other: unknown;
if ((value = other)) {}
`,
			snapshot: `
declare let value: unknown;
declare let other: unknown;
if (!!(value = other)) {}
    ~~~~~~~~~~~~~~~~~
    Casting this value to a boolean is unnecessary in this context.
`,
		},
		{
			code: `
declare let value: unknown;
declare let other: unknown;
if (Boolean(value = other)) {}
`,
			output: `
declare let value: unknown;
declare let other: unknown;
if (value = other) {}
`,
			snapshot: `
declare let value: unknown;
declare let other: unknown;
if (Boolean(value = other)) {}
    ~~~~~~~~~~~~~~~~~~~~~~
    Casting this value to a boolean is unnecessary in this context.
`,
		},
	],
	valid: [
		`declare let value: unknown;
if (value) {}`,
		`declare let condition: unknown;
while (condition) {}`,
		`declare let flag: unknown;
const result = flag ? "yes" : "no";`,
		`declare let value: unknown;
const bool = !!value;`,
		`declare let value: unknown;
const bool = Boolean(value);`,
		`declare let value: unknown;
!value;`,
		`declare let value: unknown;
const inverted = !value;`,
		`declare let value: unknown;
if (!value) {}`,
		`declare let flag: unknown;
const result = { enabled: !!flag };`,
	],
});
