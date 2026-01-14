import rule from "./globalAssignments.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
undefined = 1;
`,
			snapshot: `
undefined = 1;
~~~~~~~~~
Read-only global variables should not be reassigned or modified.
`,
		},
		{
			code: `
NaN = 42;
`,
			snapshot: `
NaN = 42;
~~~
Read-only global variables should not be reassigned or modified.
`,
		},
		{
			code: `
Infinity = 100;
`,
			snapshot: `
Infinity = 100;
~~~~~~~~
Read-only global variables should not be reassigned or modified.
`,
		},
		{
			code: `
Object = null;
`,
			snapshot: `
Object = null;
~~~~~~
Read-only global variables should not be reassigned or modified.
`,
		},
		{
			code: `
Array = function() {};
`,
			snapshot: `
Array = function() {};
~~~~~
Read-only global variables should not be reassigned or modified.
`,
		},
		{
			code: `
String = "test";
`,
			snapshot: `
String = "test";
~~~~~~
Read-only global variables should not be reassigned or modified.
`,
		},
		{
			code: `
Number = 123;
`,
			snapshot: `
Number = 123;
~~~~~~
Read-only global variables should not be reassigned or modified.
`,
		},
		{
			code: `
Boolean = true;
`,
			snapshot: `
Boolean = true;
~~~~~~~
Read-only global variables should not be reassigned or modified.
`,
		},
		{
			code: `
Math = {};
`,
			snapshot: `
Math = {};
~~~~
Read-only global variables should not be reassigned or modified.
`,
		},
		{
			code: `
JSON = null;
`,
			snapshot: `
JSON = null;
~~~~
Read-only global variables should not be reassigned or modified.
`,
		},
		{
			code: `
window = {};
`,
			snapshot: `
window = {};
~~~~~~
Read-only global variables should not be reassigned or modified.
`,
		},
		{
			code: `
undefined += 1;
`,
			snapshot: `
undefined += 1;
~~~~~~~~~
Read-only global variables should not be reassigned or modified.
`,
		},
		{
			code: `
NaN *= 2;
`,
			snapshot: `
NaN *= 2;
~~~
Read-only global variables should not be reassigned or modified.
`,
		},
		{
			code: `
++undefined;
`,
			snapshot: `
++undefined;
  ~~~~~~~~~
  Read-only global variables should not be reassigned or modified.
`,
		},
		{
			code: `
NaN++;
`,
			snapshot: `
NaN++;
~~~
Read-only global variables should not be reassigned or modified.
`,
		},
		{
			code: `
--Infinity;
`,
			snapshot: `
--Infinity;
  ~~~~~~~~
  Read-only global variables should not be reassigned or modified.
`,
		},
		{
			code: `
Object--;
`,
			snapshot: `
Object--;
~~~~~~
Read-only global variables should not be reassigned or modified.
`,
		},
	],
	valid: [
		`let undefined = 1;`,
		`const NaN = 42;`,
		`var Infinity = 100;`,
		`function Object() {}`,
		`let value = undefined;`,
		`const result = NaN;`,
		`if (value === undefined) {}`,
		`const obj = { undefined: 1 };`,
		`obj.undefined = 2;`,
		`const custom = { NaN: 42 }; custom.NaN = 100;`,
		`let myVar = 5; myVar = 10;`,
		`const data = { value: 1 }; data.value = 2;`,
		`let counter = 0; counter++;`,
		`let index = 10; --index;`,
		`
function test() {
    let undefined = 5;
    undefined = 10;
}
`,
		`
const obj = {
    undefined: 1,
    NaN: 2,
};
obj.undefined = 5;
`,
		`
const fn = (undefined: number) => {
    undefined = 10;
};
`,
		`
function test(NaN: string) {
    NaN = "updated";
}
`,
	],
});
