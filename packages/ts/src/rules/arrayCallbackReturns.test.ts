import rule from "./arrayCallbackReturns.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
declare const values: number[];
const result = values.map((value) => {
    void value;
});
`,
			snapshot: `
declare const values: number[];
const result = values.map((value) => {
                          ~~~~~~~~~~~~
                          Array method \`map\` callback expects a return value.
    void value;
    ~~~~~~~~~~~
});
~
`,
		},
		{
			code: `
declare const values: number[];
const result = values.filter(function (value) {
    void value;
});
`,
			snapshot: `
declare const values: number[];
const result = values.filter(function (value) {
                             ~~~~~~~~~~~~~~~~~~
                             Array method \`filter\` callback expects a return value.
    void value;
    ~~~~~~~~~~~
});
~
`,
		},
		{
			code: `
declare const values: number[];
const result = values.find((value) => {
    value > 10;
});
`,
			snapshot: `
declare const values: number[];
const result = values.find((value) => {
                           ~~~~~~~~~~~~
                           Array method \`find\` callback expects a return value.
    value > 10;
    ~~~~~~~~~~~
});
~
`,
		},
		{
			code: `
declare const values: number[];
declare const target: number;
const result = values.some((value) => {
    value === target;
});
`,
			snapshot: `
declare const values: number[];
declare const target: number;
const result = values.some((value) => {
                           ~~~~~~~~~~~~
                           Array method \`some\` callback expects a return value.
    value === target;
    ~~~~~~~~~~~~~~~~~
});
~
`,
		},
		{
			code: `
declare const values: number[];
const result = values.every((value) => {
    value > 0;
});
`,
			snapshot: `
declare const values: number[];
const result = values.every((value) => {
                            ~~~~~~~~~~~~
                            Array method \`every\` callback expects a return value.
    value > 0;
    ~~~~~~~~~~
});
~
`,
		},
		{
			code: `
declare const values: number[];
const result = values.flatMap((value) => {
    void value;
});
`,
			snapshot: `
declare const values: number[];
const result = values.flatMap((value) => {
                              ~~~~~~~~~~~~
                              Array method \`flatMap\` callback expects a return value.
    void value;
    ~~~~~~~~~~~
});
~
`,
		},
		{
			code: `
declare const values: number[];
declare const target: number;
const result = values.findIndex((value) => {
    value === target;
});
`,
			snapshot: `
declare const values: number[];
declare const target: number;
const result = values.findIndex((value) => {
                                ~~~~~~~~~~~~
                                Array method \`findIndex\` callback expects a return value.
    value === target;
    ~~~~~~~~~~~~~~~~~
});
~
`,
		},
	],
	valid: [
		`
declare const values: number[];
const result = values.map((value) => value * 2);
`,
		`
declare const values: number[];
const result = values.map((value) => {
    return value * 2;
});
`,
		`
declare const values: number[];
const result = values.filter((value) => value > 0);
`,
		`
declare const values: number[];
const result = values.filter((value) => {
    return value > 0;
});
`,
		`
declare const values: number[];
declare const target: number;
const result = values.find((value) => value === target);
`,
		`
declare const values: number[];
const result = values.some((value) => value > 0);
`,
		`
declare const values: number[];
const result = values.every((value) => value > 0);
`,
		`
declare const values: number[];
const result = values.reduce((sum, value) => sum + value, 0);
`,
		`
declare const values: number[];
const result = values.reduce((sum, value) => {
    return sum + value;
}, 0);
`,
		`
declare const values: number[];
values.forEach((value) => {
    void value;
});
`,
		`
declare const values: number[];
values.forEach((value) => void value);
`,
		`
declare const values: number[];
declare const transform: (value: number) => number;
const result = values.map(transform);
`,
		`
declare const values: number[];
const result = values.sort((a, b) => a - b);
`,
		`
declare const values: number[];
const result = values.toSorted((a, b) => a - b);
`,
		`
declare const values: number[];
const result = values.findLast((value) => value > 0);
`,
		`
declare const values: number[];
const result = values.findLastIndex((value) => value > 0);
`,
	],
});
