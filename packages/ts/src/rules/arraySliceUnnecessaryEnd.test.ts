import rule from "./arraySliceUnnecessaryEnd.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
const values = [1, 2, 3];
const result = values.slice(1, values.length);
`,
			output: `
const values = [1, 2, 3];
const result = values.slice(1);
`,
			snapshot: `
const values = [1, 2, 3];
const result = values.slice(1, values.length);
                               ~~~~~~~~~~~~~
                               The \`end\` argument is unnecessary when slicing to the end of the array or string.
`,
		},
		{
			code: `
const text = "hello";
const result = text.slice(1, text.length);
`,
			output: `
const text = "hello";
const result = text.slice(1);
`,
			snapshot: `
const text = "hello";
const result = text.slice(1, text.length);
                             ~~~~~~~~~~~
                             The \`end\` argument is unnecessary when slicing to the end of the array or string.
`,
		},
		{
			code: `
const items = [1, 2, 3];
const result = items.slice(0, Infinity);
`,
			output: `
const items = [1, 2, 3];
const result = items.slice(0);
`,
			snapshot: `
const items = [1, 2, 3];
const result = items.slice(0, Infinity);
                              ~~~~~~~~
                              The \`end\` argument is unnecessary when slicing to the end of the array or string.
`,
		},
		{
			code: `
const data = [1, 2, 3];
const result = data.slice(0, Number.POSITIVE_INFINITY);
`,
			output: `
const data = [1, 2, 3];
const result = data.slice(0);
`,
			snapshot: `
const data = [1, 2, 3];
const result = data.slice(0, Number.POSITIVE_INFINITY);
                             ~~~~~~~~~~~~~~~~~~~~~~~~
                             The \`end\` argument is unnecessary when slicing to the end of the array or string.
`,
		},
		{
			code: `
const values = [1, 2, 3, 4, 5];
doSomething(values.slice(2, values.length));
`,
			output: `
const values = [1, 2, 3, 4, 5];
doSomething(values.slice(2));
`,
			snapshot: `
const values = [1, 2, 3, 4, 5];
doSomething(values.slice(2, values.length));
                            ~~~~~~~~~~~~~
                            The \`end\` argument is unnecessary when slicing to the end of the array or string.
`,
		},
	],
	valid: [
		`const values = [1, 2, 3]; const result = values.slice(1);`,
		`const values = [1, 2, 3]; const result = values.slice(1, 2);`,
		`const values = [1, 2, 3]; const result = values.slice(0, -1);`,
		`const values = [1, 2, 3]; const other = [4, 5]; const result = values.slice(0, other.length);`,
		`const text = "hello"; const result = text.slice(0, 3);`,
		`const values = [1, 2, 3]; const result = values.slice();`,
	],
});
