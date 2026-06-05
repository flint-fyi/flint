import rule from "./globalAssignments.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
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
Object = Object;
`,
			snapshot: `
Object = Object;
~~~~~~
Read-only global variables should not be reassigned or modified.
`,
		},
		{
			code: `
Array = Array;
`,
			snapshot: `
Array = Array;
~~~~~
Read-only global variables should not be reassigned or modified.
`,
		},
		{
			code: `
String = String;
`,
			snapshot: `
String = String;
~~~~~~
Read-only global variables should not be reassigned or modified.
`,
		},
		{
			code: `
Number = Number;
`,
			snapshot: `
Number = Number;
~~~~~~
Read-only global variables should not be reassigned or modified.
`,
		},
		{
			code: `
Boolean = Boolean;
`,
			snapshot: `
Boolean = Boolean;
~~~~~~~
Read-only global variables should not be reassigned or modified.
`,
		},
		{
			code: `
Math = Math;
`,
			snapshot: `
Math = Math;
~~~~
Read-only global variables should not be reassigned or modified.
`,
		},
		{
			code: `
JSON = JSON;
`,
			snapshot: `
JSON = JSON;
~~~~
Read-only global variables should not be reassigned or modified.
`,
		},
		{
			code: `
window = window;
`,
			files: {
				"tsconfig.json": `{
	"extends": "./tsconfig.base.json",
	"compilerOptions": {
		"lib": ["esnext", "DOM"]
	}
}`,
			},
			snapshot: `
window = window;
~~~~~~
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
	],
	valid: [
		`
let undefined = 1;
undefined;
`,
		`
const NaN = 42;
NaN;
`,
		`
var Infinity = 100;
Infinity;
`,
		`
function Object() {}
Object();
`,
		`
let value = undefined;
value;
`,
		`
const result = NaN;
result;
`,
		`
declare const value: number | undefined;
if (value === undefined) {}
`,
		`
const obj = { undefined: 1 };
obj;
`,
		`
const obj = { undefined: 1 };
obj.undefined = 2;
`,
		`
const custom = { NaN: 42 };
custom.NaN = 100;
`,
		`
let myVar = 5;
myVar = 10;
`,
		`
const data = { value: 1 };
data.value = 2;
`,
		`
let counter = 0;
counter++;
`,
		`
let index = 10;
--index;
`,
		`
function test() {
    let undefined = 5;
    undefined = 10;
}
test();
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
fn(5);
`,
		`
function test(NaN: string) {
    NaN = "updated";
}
test("value");
`,
	],
});
