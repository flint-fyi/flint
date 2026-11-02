import rule from "./constantAssignments.ts";
import { javascriptRuleTester, ruleTester } from "./ruleTester.ts";

javascriptRuleTester.describe(rule, {
	invalid: [
		{
			files: {
				"file.js": `
const value = 1;
value = 2;
`,
			},
			snapshot: {
				"file.js": `
const value = 1;
value = 2;
~~~~~
Variables declared with const cannot be reassigned; use let or var instead if reassignment is needed.
`,
			},
		},
	],
	valid: [],
});

ruleTester.describe(rule, {
	invalid: [],
	valid: [
		`const value = 1; void value;`,
		`
declare function getValue(): number;
const result = getValue();
void result;
`,
		`let value = 1; value = 2; void value;`,
		`var value = 1; value = 2; void value;`,
		`const object: { property?: string } = {}; object.property = "value";`,
		`const array: number[] = []; array.push(1);`,
		`const object = { value: 1 }; object.value = 2;`,
		`const array = [1, 2, 3]; array[0] = 4;`,
		`
declare const object: { property: string };
const { property } = object;
void property;
`,
		`
declare const array: [number, number];
const [first, second] = array;
void first;
void second;
`,
		`
declare const items: string[];
declare function processItem(item: string): string;
for (let item of items) { item = processItem(item); }
`,
		`
declare const items: string[];
for (const item of items) { void item; }
`,
		`
const outer = 1;
function inner() {
    const outer = 2;
    return outer;
}
void outer;
void inner;
`,
		`
const value = 1;
void value;
{
    const value = 2;
    void value;
}
`,
		`
function process(value: number) {
    const result = value * 2;
    return result;
}
void process;
`,
		`
const calculate = (input: number) => {
    const result = input + 10;
    return result;
};
void calculate;
`,
		`
class MyClass {
    method() {
        const value = 0;
        return value;
    }
}
void MyClass;
`,
	],
});
