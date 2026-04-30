import rule from "./arrayCallbackReturns.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
const result = values.map((value) => {
    console.log(value);
});
`,
			snapshot: `
const result = values.map((value) => {
                          ~~~~~~~~~~~~
                          Array method \`map\` callback expects a return value.
    console.log(value);
    ~~~~~~~~~~~~~~~~~~~
});
~
`,
		},
		{
			code: `
const result = values.filter(function (value) {
    console.log(value);
});
`,
			snapshot: `
const result = values.filter(function (value) {
                             ~~~~~~~~~~~~~~~~~~
                             Array method \`filter\` callback expects a return value.
    console.log(value);
    ~~~~~~~~~~~~~~~~~~~
});
~
`,
		},
		{
			code: `
const result = values.find((value) => {
    value > 10;
});
`,
			snapshot: `
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
const result = values.some((value) => {
    value === target;
});
`,
			snapshot: `
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
const result = values.every((value) => {
    value > 0;
});
`,
			snapshot: `
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
const result = values.reduce((accumulator, value) => {
    accumulator.push(value);
}, []);
`,
			snapshot: `
const result = values.reduce((accumulator, value) => {
                             ~~~~~~~~~~~~~~~~~~~~~~~~~
                             Array method \`reduce\` callback expects a return value.
    accumulator.push(value);
    ~~~~~~~~~~~~~~~~~~~~~~~~
}, []);
~
`,
		},
		{
			code: `
const result = values.flatMap((value) => {
    console.log(value);
});
`,
			snapshot: `
const result = values.flatMap((value) => {
                              ~~~~~~~~~~~~
                              Array method \`flatMap\` callback expects a return value.
    console.log(value);
    ~~~~~~~~~~~~~~~~~~~
});
~
`,
		},
		{
			code: `
const result = values.findIndex((value) => {
    value === target;
});
`,
			snapshot: `
const result = values.findIndex((value) => {
                                ~~~~~~~~~~~~
                                Array method \`findIndex\` callback expects a return value.
    value === target;
    ~~~~~~~~~~~~~~~~~
});
~
`,
		},
		{
			code: `
const sorted = values.sort((a, b) => {
    console.log(a, b);
});
`,
			snapshot: `
const sorted = values.sort((a, b) => {
                           ~~~~~~~~~~~
                           Array method \`sort\` callback expects a return value.
    console.log(a, b);
    ~~~~~~~~~~~~~~~~~~
});
~
`,
		},
		{
			code: `
const sorted = values.toSorted((a, b) => {
    console.log(a, b);
});
`,
			snapshot: `
const sorted = values.toSorted((a, b) => {
                               ~~~~~~~~~~~
                               Array method \`toSorted\` callback expects a return value.
    console.log(a, b);
    ~~~~~~~~~~~~~~~~~~
});
~
`,
		},
	],
	valid: [
		`const result = values.map((value) => value * 2);`,
		`const result = values.map((value) => { return value * 2; });`,
		`const result = values.filter((value) => value > 0);`,
		`const result = values.filter((value) => { return value > 0; });`,
		`const result = values.find((value) => value === target);`,
		`const result = values.some((value) => value > 0);`,
		`const result = values.every((value) => value > 0);`,
		`const result = values.reduce((sum, value) => sum + value, 0);`,
		`const result = values.reduce((sum, value) => { return sum + value; }, 0);`,
		`values.forEach((value) => { console.log(value); });`,
		`values.forEach((value) => console.log(value));`,
		`const result = values.map(transform);`,
		`const result = values.sort((a, b) => a - b);`,
		`const result = values.toSorted((a, b) => a - b);`,
		`const result = values.findLast((value) => value > 0);`,
		`const result = values.findLastIndex((value) => value > 0);`,
	],
});
