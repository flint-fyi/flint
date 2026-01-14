import { ruleTester } from "./ruleTester.ts";
import rule from "./selfAssignments.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
value = value;
`,
			snapshot: `
value = value;
~~~~~~~~~~~~~
This value is being assigned to itself, which does nothing.
`,
		},
		{
			code: `
count &&= count;
`,
			snapshot: `
count &&= count;
~~~~~~~~~~~~~~~
This value is being assigned to itself, which does nothing.
`,
		},
		{
			code: `
flag ||= flag;
`,
			snapshot: `
flag ||= flag;
~~~~~~~~~~~~~
This value is being assigned to itself, which does nothing.
`,
		},
		{
			code: `
data ??= data;
`,
			snapshot: `
data ??= data;
~~~~~~~~~~~~~
This value is being assigned to itself, which does nothing.
`,
		},
		{
			code: `
a.b ??= a.b;
`,
			snapshot: `
a.b ??= a.b;
~~~~~~~~~~~
This value is being assigned to itself, which does nothing.
`,
		},
	],
	valid: [
		`value = other;`,
		`first = second;`,
		`let value = value;`,
		`const data = data;`,
		`value += value;`,
		`count -= count;`,
		`a ||= b;`,
		`a.b ||= a.c;`,
	],
});
