import { ruleTester } from "./ruleTester.ts";
import rule from "./unnecessaryLogicalComparisons.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
const value = flag === true;
`,
			output: `
const value = flag;
`,
			snapshot: `
const value = flag === true;
              ~~~~~~~~~~~~~
              Comparing to a boolean literal is unnecessary.
`,
		},
		{
			code: `
const value = flag === false;
`,
			output: `
const value = !flag;
`,
			snapshot: `
const value = flag === false;
              ~~~~~~~~~~~~~~
              Comparing to a boolean literal is unnecessary.
`,
		},
		{
			code: `
const value = flag !== true;
`,
			output: `
const value = !flag;
`,
			snapshot: `
const value = flag !== true;
              ~~~~~~~~~~~~~
              Comparing to a boolean literal is unnecessary.
`,
		},
		{
			code: `
const value = flag !== false;
`,
			output: `
const value = flag;
`,
			snapshot: `
const value = flag !== false;
              ~~~~~~~~~~~~~~
              Comparing to a boolean literal is unnecessary.
`,
		},
		{
			code: `
const value = flag == true;
`,
			output: `
const value = flag;
`,
			snapshot: `
const value = flag == true;
              ~~~~~~~~~~~~
              Comparing to a boolean literal is unnecessary.
`,
		},
		{
			code: `
const value = flag == false;
`,
			output: `
const value = !flag;
`,
			snapshot: `
const value = flag == false;
              ~~~~~~~~~~~~~
              Comparing to a boolean literal is unnecessary.
`,
		},
		{
			code: `
const value = flag != true;
`,
			output: `
const value = !flag;
`,
			snapshot: `
const value = flag != true;
              ~~~~~~~~~~~~
              Comparing to a boolean literal is unnecessary.
`,
		},
		{
			code: `
const value = flag != false;
`,
			output: `
const value = flag;
`,
			snapshot: `
const value = flag != false;
              ~~~~~~~~~~~~~
              Comparing to a boolean literal is unnecessary.
`,
		},
		{
			code: `
const value = true === flag;
`,
			output: `
const value = flag;
`,
			snapshot: `
const value = true === flag;
              ~~~~~~~~~~~~~
              Comparing to a boolean literal is unnecessary.
`,
		},
		{
			code: `
const value = false === flag;
`,
			output: `
const value = !flag;
`,
			snapshot: `
const value = false === flag;
              ~~~~~~~~~~~~~~
              Comparing to a boolean literal is unnecessary.
`,
		},
		{
			code: `
const value = true !== flag;
`,
			output: `
const value = !flag;
`,
			snapshot: `
const value = true !== flag;
              ~~~~~~~~~~~~~
              Comparing to a boolean literal is unnecessary.
`,
		},
		{
			code: `
const value = false !== flag;
`,
			output: `
const value = flag;
`,
			snapshot: `
const value = false !== flag;
              ~~~~~~~~~~~~~~
              Comparing to a boolean literal is unnecessary.
`,
		},
		{
			code: `
if (condition === true) { console.log("yes"); }
`,
			output: `
if (condition) { console.log("yes"); }
`,
			snapshot: `
if (condition === true) { console.log("yes"); }
    ~~~~~~~~~~~~~~~~~~
    Comparing to a boolean literal is unnecessary.
`,
		},
		{
			code: `
while (running === false) { wait(); }
`,
			output: `
while (!running) { wait(); }
`,
			snapshot: `
while (running === false) { wait(); }
       ~~~~~~~~~~~~~~~~~
       Comparing to a boolean literal is unnecessary.
`,
		},
		{
			code: `
const result = isValid !== true ? "no" : "yes";
`,
			output: `
const result = !isValid ? "no" : "yes";
`,
			snapshot: `
const result = isValid !== true ? "no" : "yes";
               ~~~~~~~~~~~~~~~~
               Comparing to a boolean literal is unnecessary.
`,
		},
		{
			code: `
const check = (enabled) === true;
`,
			output: `
const check = enabled;
`,
			snapshot: `
const check = (enabled) === true;
              ~~~~~~~~~~~~~~~~~~
              Comparing to a boolean literal is unnecessary.
`,
		},
		{
			code: `
const check = object.property === true;
`,
			output: `
const check = object.property;
`,
			snapshot: `
const check = object.property === true;
              ~~~~~~~~~~~~~~~~~~~~~~~~
              Comparing to a boolean literal is unnecessary.
`,
		},
		{
			code: `
const check = array[0] === false;
`,
			output: `
const check = !array[0];
`,
			snapshot: `
const check = array[0] === false;
              ~~~~~~~~~~~~~~~~~~
              Comparing to a boolean literal is unnecessary.
`,
		},
	],
	valid: [
		{ code: `const value = flag;` },
		{ code: `const value = !flag;` },
		{ code: `const value = flag === other;` },
		{ code: `const value = flag !== other;` },
		{ code: `const value = flag == other;` },
		{ code: `const value = flag != other;` },
		{ code: `if (condition) { console.log("yes"); }` },
		{ code: `if (!condition) { console.log("no"); }` },
		{ code: `const result = condition ? "yes" : "no";` },
		{ code: `const check = value === 1;` },
		{ code: `const check = value === "true";` },
		{ code: `const check = value === null;` },
		{ code: `const check = value === undefined;` },
		{ code: `const check = true === true;` },
		{ code: `const check = false === false;` },
	],
});
