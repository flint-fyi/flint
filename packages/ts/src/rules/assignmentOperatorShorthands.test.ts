import rule from "./assignmentOperatorShorthands.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
let value = 0;
value = value || 1;
`,
			output: `
let value = 0;
value ||= 1;
`,
			snapshot: `
let value = 0;
value = value || 1;
~~~~~~~~~~~~~~~~~~
Prefer the logical assignment operator shorthand \`||=\`.
`,
		},
		{
			code: `
let enabled = true;
enabled = enabled && false;
`,
			output: `
let enabled = true;
enabled &&= false;
`,
			snapshot: `
let enabled = true;
enabled = enabled && false;
~~~~~~~~~~~~~~~~~~~~~~~~~~
Prefer the logical assignment operator shorthand \`&&=\`.
`,
		},
		{
			code: `
let value: number | null = null;
value = value ?? 1;
`,
			output: `
let value: number | null = null;
value ??= 1;
`,
			snapshot: `
let value: number | null = null;
value = value ?? 1;
~~~~~~~~~~~~~~~~~~
Prefer the logical assignment operator shorthand \`??=\`.
`,
		},
		{
			code: `
const object = { property: 0 };
object.property = object.property || 1;
`,
			output: `
const object = { property: 0 };
object.property ||= 1;
`,
			snapshot: `
const object = { property: 0 };
object.property = object.property || 1;
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
Prefer the logical assignment operator shorthand \`||=\`.
`,
		},
		{
			code: `
const array = [0];
array[0] = array[0] || 1;
`,
			output: `
const array = [0];
array[0] ||= 1;
`,
			snapshot: `
const array = [0];
array[0] = array[0] || 1;
~~~~~~~~~~~~~~~~~~~~~~~~
Prefer the logical assignment operator shorthand \`||=\`.
`,
		},
		{
			code: `
let result = false;
result = result || getValue();
`,
			output: `
let result = false;
result ||= getValue();
`,
			snapshot: `
let result = false;
result = result || getValue();
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
Prefer the logical assignment operator shorthand \`||=\`.
`,
		},
		{
			code: `
const data = { nested: { value: null as number | null } };
data.nested.value = data.nested.value ?? getDefault();
`,
			output: `
const data = { nested: { value: null as number | null } };
data.nested.value ??= getDefault();
`,
			snapshot: `
const data = { nested: { value: null as number | null } };
data.nested.value = data.nested.value ?? getDefault();
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
Prefer the logical assignment operator shorthand \`??=\`.
`,
		},
	],
	valid: [
		`let value = 0; value ||= 1;`,
		`let value = 0; value &&= 1;`,
		`let value: number | null = null; value ??= 1;`,
		`let value = 0; value = other || 1;`,
		`let value = 0; value = other && 1;`,
		`let value: number | null = null; value = other ?? 1;`,
		`let value = 0; value = 1 || value;`,
		`let value = 0; value = 1 && value;`,
		`let value: number | null = null; value = 1 ?? value;`,
		`let value = 0; value = value + 1;`,
		`let value = 0; value = value - 1;`,
		`let value = 0; value = value * 2;`,
		`const object = { a: 0, b: 1 }; object.a = object.b || 1;`,
		`const array = [0, 1]; array[0] = array[1] || 1;`,
		`let count = 0; count = count || other || 1;`,
	],
});
