import { ruleTester } from "./ruleTester.ts";
import rule from "./sparseArrays.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
const array = [1, , 3];
`,
			snapshot: `
const array = [1, , 3];
                  ~
                  Sparse arrays with "holes" (empty slots) are misleading and behave differently from \`undefined\` values.
`,
		},
		{
			code: `
const array = [, 2, 3];
`,
			snapshot: `
const array = [, 2, 3];
               ~
               Sparse arrays with "holes" (empty slots) are misleading and behave differently from \`undefined\` values.
`,
		},
		{
			code: `
const array = [1, , , 4];
`,
			snapshot: `
const array = [1, , , 4];
                  ~
                  Sparse arrays with "holes" (empty slots) are misleading and behave differently from \`undefined\` values.
                    ~
                    Sparse arrays with "holes" (empty slots) are misleading and behave differently from \`undefined\` values.
`,
		},
		{
			code: `
const nested = [[1, , 3], [4, 5, 6]];
`,
			snapshot: `
const nested = [[1, , 3], [4, 5, 6]];
                    ~
                    Sparse arrays with "holes" (empty slots) are misleading and behave differently from \`undefined\` values.
`,
		},
		{
			code: `
const result = [
    1,
    ,
    3
];
`,
			snapshot: `
const result = [
    1,
    ,
    ~
    Sparse arrays with "holes" (empty slots) are misleading and behave differently from \`undefined\` values.
    3
];
`,
		},
		{
			code: `
const matrix = [
    [1, 2, 3],
    [4, , 6],
    [7, 8, 9]
];
`,
			snapshot: `
const matrix = [
    [1, 2, 3],
    [4, , 6],
        ~
        Sparse arrays with "holes" (empty slots) are misleading and behave differently from \`undefined\` values.
    [7, 8, 9]
];
`,
		},
		{
			code: `
function getArray() {
    return [1, , 3];
}
`,
			snapshot: `
function getArray() {
    return [1, , 3];
               ~
               Sparse arrays with "holes" (empty slots) are misleading and behave differently from \`undefined\` values.
}
`,
		},
	],
	valid: [
		`const array = [1, 2, 3];`,
		`const array = [];`,
		`const array = [1];`,
		`const array = [1, undefined, 3];`,
		`const array = [undefined, 2, 3];`,
		`const array = [1, 2, undefined];`,
		`const array = [1, 2, 3,];`,
		`const nested = [[1, undefined, 3], [4, 5, 6]];`,
		`const matrix = [[1, 2, 3], [4, undefined, 6], [7, 8, 9]];`,
		`const values = [null, undefined, 0, false, ""];`,
	],
});
