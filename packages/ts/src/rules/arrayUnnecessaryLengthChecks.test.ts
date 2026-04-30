import rule from "./arrayUnnecessaryLengthChecks.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
declare const array: boolean[];
array.length !== 0 && array.some(Boolean);
`,
			output: `
declare const array: boolean[];
array.some(Boolean);
`,
			snapshot: `
declare const array: boolean[];
array.length !== 0 && array.some(Boolean);
~~~~~~~~~~~~~~~~~~
Unnecessary length check before \`.some()\`.
`,
		},
		{
			code: `
declare const array: boolean[];
array.length > 0 && array.some(Boolean);
`,
			output: `
declare const array: boolean[];
array.some(Boolean);
`,
			snapshot: `
declare const array: boolean[];
array.length > 0 && array.some(Boolean);
~~~~~~~~~~~~~~~~
Unnecessary length check before \`.some()\`.
`,
		},
		{
			code: `
declare const array: boolean[];
array.length === 0 || array.every(Boolean);
`,
			output: `
declare const array: boolean[];
array.every(Boolean);
`,
			snapshot: `
declare const array: boolean[];
array.length === 0 || array.every(Boolean);
~~~~~~~~~~~~~~~~~~
Unnecessary length check before \`.every()\`.
`,
		},
		{
			code: `
declare const array: boolean[];
0 === array.length || array.every(Boolean);
`,
			output: `
declare const array: boolean[];
array.every(Boolean);
`,
			snapshot: `
declare const array: boolean[];
0 === array.length || array.every(Boolean);
~~~~~~~~~~~~~~~~~~
Unnecessary length check before \`.every()\`.
`,
		},
		{
			code: `
declare const array: number[];
array.length !== 0 && array.some((value) => value > 0);
`,
			output: `
declare const array: number[];
array.some((value) => value > 0);
`,
			snapshot: `
declare const array: number[];
array.length !== 0 && array.some((value) => value > 0);
~~~~~~~~~~~~~~~~~~
Unnecessary length check before \`.some()\`.
`,
		},
	],
	valid: [
		`declare const array: boolean[]; array.some(Boolean);`,
		`declare const array: boolean[]; array.every(Boolean);`,
		`declare const array: boolean[]; array.length !== 0 && array.every(Boolean);`,
		`declare const array: boolean[]; array.length === 0 || array.some(Boolean);`,
		`declare const array: boolean[]; const other: boolean[] = []; array.length !== 0 && other.some(Boolean);`,
		`declare const array: boolean[]; array.length > 0 && array.every(Boolean);`,
	],
});
