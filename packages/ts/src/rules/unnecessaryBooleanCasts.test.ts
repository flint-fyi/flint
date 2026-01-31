import { ruleTester } from "./ruleTester.ts";
import rule from "./unnecessaryBooleanCasts.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
if (!!value) {}
`,
			output: `
if (value) {}
`,
			snapshot: `
if (!!value) {}
    ~~~~~~~
    Casting this value to a boolean is unnecessary in this context.
`,
		},
		{
			code: `
while (!!condition) {}
`,
			output: `
while (condition) {}
`,
			snapshot: `
while (!!condition) {}
       ~~~~~~~~~~~
       Casting this value to a boolean is unnecessary in this context.
`,
		},
		{
			code: `
const result = !!flag ? "yes" : "no";
`,
			output: `
const result = flag ? "yes" : "no";
`,
			snapshot: `
const result = !!flag ? "yes" : "no";
               ~~~~~~
               Casting this value to a boolean is unnecessary in this context.
`,
		},
		{
			code: `
if (Boolean(value)) {}
`,
			output: `
if (value) {}
`,
			snapshot: `
if (Boolean(value)) {}
    ~~~~~~~~~~~~~~
    Casting this value to a boolean is unnecessary in this context.
`,
		},
		{
			code: `
while (Boolean(condition)) {}
`,
			output: `
while (condition) {}
`,
			snapshot: `
while (Boolean(condition)) {}
       ~~~~~~~~~~~~~~~~~~
       Casting this value to a boolean is unnecessary in this context.
`,
		},
		{
			code: `
do {} while (!!active);
`,
			output: `
do {} while (active);
`,
			snapshot: `
do {} while (!!active);
             ~~~~~~~~
             Casting this value to a boolean is unnecessary in this context.
`,
		},
		{
			code: `
for (; !!running;) {}
`,
			output: `
for (; running;) {}
`,
			snapshot: `
for (; !!running;) {}
       ~~~~~~~~~
       Casting this value to a boolean is unnecessary in this context.
`,
		},
		{
			code: `
if (Boolean(fn?.(value))) {}
`,
			output: `
if (fn?.(value)) {}
`,
			snapshot: `
if (Boolean(fn?.(value))) {}
    ~~~~~~~~~~~~~~~~~~~~
    Casting this value to a boolean is unnecessary in this context.
`,
		},
		{
			code: `
if (!!(value && other)) {}
`,
			output: `
if ((value && other)) {}
`,
			snapshot: `
if (!!(value && other)) {}
    ~~~~~~~~~~~~~~~~~~
    Casting this value to a boolean is unnecessary in this context.
`,
		},
		{
			code: `
if (!!(value ? left : right)) {}
`,
			output: `
if ((value ? left : right)) {}
`,
			snapshot: `
if (!!(value ? left : right)) {}
    ~~~~~~~~~~~~~~~~~~~~~~~~
    Casting this value to a boolean is unnecessary in this context.
`,
		},
		{
			code: `
if (Boolean(value && other)) {}
`,
			output: `
if (value && other) {}
`,
			snapshot: `
if (Boolean(value && other)) {}
    ~~~~~~~~~~~~~~~~~~~~~~~
    Casting this value to a boolean is unnecessary in this context.
`,
		},
		{
			code: `
if (!!(value = other)) {}
`,
			output: `
if ((value = other)) {}
`,
			snapshot: `
if (!!(value = other)) {}
    ~~~~~~~~~~~~~~~~~
    Casting this value to a boolean is unnecessary in this context.
`,
		},
		{
			code: `
if (Boolean(value = other)) {}
`,
			output: `
if (value = other) {}
`,
			snapshot: `
if (Boolean(value = other)) {}
    ~~~~~~~~~~~~~~~~~~~~~~
    Casting this value to a boolean is unnecessary in this context.
`,
		},
	],
	valid: [
		`if (value) {}`,
		`while (condition) {}`,
		`const result = flag ? "yes" : "no";`,
		`const bool = !!value;`,
		`const bool = Boolean(value);`,
		`!value;`,
		`const inverted = !value;`,
		`if (!value) {}`,
		`const result = { enabled: !!flag };`,
	],
});
