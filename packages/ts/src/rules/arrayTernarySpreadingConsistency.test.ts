import rule from "./arrayTernarySpreadingConsistency.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
const condition = true;
const result = [1, ...(condition ? [2, 3] : '')];
`,
			output: `
const condition = true;
const result = [1, ...(condition ? [2, 3] : [])];
`,
			snapshot: `
const condition = true;
const result = [1, ...(condition ? [2, 3] : '')];
                                            ~~
                                            Prefer consistent types in both branches when spreading a ternary in an array.
`,
		},
		{
			code: `
const flag = false;
const items = [...(flag ? 'abc' : [])];
`,
			output: `
const flag = false;
const items = [...(flag ? 'abc' : '')];
`,
			snapshot: `
const flag = false;
const items = [...(flag ? 'abc' : [])];
                                  ~~
                                  Prefer consistent types in both branches when spreading a ternary in an array.
`,
		},
		{
			code: `
const value = true;
const array = [0, ...(value ? [1] : "")];
`,
			output: `
const value = true;
const array = [0, ...(value ? [1] : [])];
`,
			snapshot: `
const value = true;
const array = [0, ...(value ? [1] : "")];
                                    ~~
                                    Prefer consistent types in both branches when spreading a ternary in an array.
`,
		},
	],
	valid: [
		`const condition = true; const result = [1, ...(condition ? [2, 3] : [])];`,
		`const flag = false; const items = [...(flag ? 'abc' : '')];`,
		`const value = true; const array = [0, ...(value ? [1] : [2])];`,
		`const text = true; const chars = [...(text ? 'hello' : 'world')];`,
		`const condition = true; const result = [1, 2, 3];`,
		`const condition = true; const result = [...[1, 2, 3]];`,
	],
});
