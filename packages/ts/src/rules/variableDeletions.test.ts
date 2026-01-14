import { ruleTester } from "./ruleTester.ts";
import rule from "./variableDeletions.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
delete value;
`,
			snapshot: `
delete value;
~~~~~~~~~~~~
Deleting a variable with the delete operator outside of strict mode will silently fail and return false.
`,
		},
		{
			code: `
let x = 5;
delete x;
`,
			snapshot: `
let x = 5;
delete x;
~~~~~~~~
Deleting a variable with the delete operator outside of strict mode will silently fail and return false.
`,
		},
		{
			code: `
const variable = 10;
delete variable;
`,
			snapshot: `
const variable = 10;
delete variable;
~~~~~~~~~~~~~~~
Deleting a variable with the delete operator outside of strict mode will silently fail and return false.
`,
		},
		{
			code: `
function test(parameter: number) {
  delete parameter;
}
`,
			snapshot: `
function test(parameter: number) {
  delete parameter;
  ~~~~~~~~~~~~~~~~
  Deleting a variable with the delete operator outside of strict mode will silently fail and return false.
}
`,
		},
		{
			code: `
for (let index = 0; index < 10; index++) {
  delete index;
}
`,
			snapshot: `
for (let index = 0; index < 10; index++) {
  delete index;
  ~~~~~~~~~~~~
  Deleting a variable with the delete operator outside of strict mode will silently fail and return false.
}
`,
		},
	],
	valid: [
		`const obj = { prop: 1 }; delete obj.prop;`,
		`delete obj.property;`,
		`delete obj["property"];`,
		`const obj = { nested: { prop: 1 } }; delete obj.nested.prop;`,
		`const array = [1, 2, 3]; delete array[0];`,
	],
});
