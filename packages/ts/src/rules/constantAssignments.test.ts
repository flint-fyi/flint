import rule from "./constantAssignments.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
const value = 1;
value = 2;
`,
			snapshot: `
const value = 1;
value = 2;
~~~~~
Variables declared with const cannot be reassigned; use let or var instead if reassignment is needed.
`,
		},
		{
			code: `
const result = getValue();
result = getOtherValue();
`,
			snapshot: `
const result = getValue();
result = getOtherValue();
~~~~~~
Variables declared with const cannot be reassigned; use let or var instead if reassignment is needed.
`,
		},
		{
			code: `
const counter = 0;
counter++;
`,
			snapshot: `
const counter = 0;
counter++;
~~~~~~~
Variables declared with const cannot be reassigned; use let or var instead if reassignment is needed.
`,
		},
		{
			code: `
const counter = 0;
++counter;
`,
			snapshot: `
const counter = 0;
++counter;
  ~~~~~~~
  Variables declared with const cannot be reassigned; use let or var instead if reassignment is needed.
`,
		},
		{
			code: `
const total = 0;
total += 5;
`,
			snapshot: `
const total = 0;
total += 5;
~~~~~
Variables declared with const cannot be reassigned; use let or var instead if reassignment is needed.
`,
		},
		{
			code: `
const value = 10;
value -= 3;
`,
			snapshot: `
const value = 10;
value -= 3;
~~~~~
Variables declared with const cannot be reassigned; use let or var instead if reassignment is needed.
`,
		},
		{
			code: `
const { property } = object;
property = "new value";
`,
			snapshot: `
const { property } = object;
property = "new value";
~~~~~~~~
Variables declared with const cannot be reassigned; use let or var instead if reassignment is needed.
`,
		},
		{
			code: `
const [first, second] = array;
first = 100;
`,
			snapshot: `
const [first, second] = array;
first = 100;
~~~~~
Variables declared with const cannot be reassigned; use let or var instead if reassignment is needed.
`,
		},
		{
			code: `
const { nested: { deep } } = object;
deep = "modified";
`,
			snapshot: `
const { nested: { deep } } = object;
deep = "modified";
~~~~
Variables declared with const cannot be reassigned; use let or var instead if reassignment is needed.
`,
		},
		{
			code: `
const [first, ...rest] = array;
rest = [];
`,
			snapshot: `
const [first, ...rest] = array;
rest = [];
~~~~
Variables declared with const cannot be reassigned; use let or var instead if reassignment is needed.
`,
		},
		{
			code: `
for (const item of items) {
    item = processItem(item);
}
`,
			snapshot: `
for (const item of items) {
    item = processItem(item);
    ~~~~
    Variables declared with const cannot be reassigned; use let or var instead if reassignment is needed.
}
`,
		},
		{
			code: `
function process() {
    const value = 1;
    value = 2;
}
`,
			snapshot: `
function process() {
    const value = 1;
    value = 2;
    ~~~~~
    Variables declared with const cannot be reassigned; use let or var instead if reassignment is needed.
}
`,
		},
		{
			code: `
const data = getData();
if (condition) {
    data = getOtherData();
}
`,
			snapshot: `
const data = getData();
if (condition) {
    data = getOtherData();
    ~~~~
    Variables declared with const cannot be reassigned; use let or var instead if reassignment is needed.
}
`,
		},
	],
	valid: [
		`const value = 1;`,
		`const result = getValue();`,
		`let value = 1; value = 2;`,
		`var value = 1; value = 2;`,
		`const object = {}; object.property = "value";`,
		`const array = []; array.push(1);`,
		`const object = { value: 1 }; object.value = 2;`,
		`const array = [1, 2, 3]; array[0] = 4;`,
		`const value = 1; console.log(value);`,
		`const { property } = object; console.log(property);`,
		`const [first, second] = array; console.log(first);`,
		`for (let item of items) { item = processItem(item); }`,
		`for (const item of items) { console.log(item); }`,
		`
const outer = 1;
function inner() {
    const outer = 2;
    return outer;
}
`,
		`
const value = 1;
{
    const value = 2;
    console.log(value);
}
`,
		`
function process(value: number) {
    const result = value * 2;
    return result;
}
`,
		`
const calculate = (input: number) => {
    const result = input + 10;
    return result;
};
`,
		`
class MyClass {
    method() {
        const value = 0;
        return value;
    }
}
`,
	],
});
