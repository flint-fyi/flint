import { createRuleTesterTSConfig } from "@flint.fyi/typescript-language";

import rule from "./constantAssignments.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
const value = 1;
value = 2;
`,
			fileName: "file.js",
			files: createRuleTesterTSConfig({
				allowJs: true,
				checkJs: false,
				noEmit: true,
				noUnusedLocals: false,
			}),
			snapshot: `
const value = 1;
value = 2;
~~~~~
Variables declared with const cannot be reassigned; use let or var instead if reassignment is needed.
`,
		},
	],
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
		`const value = 1; void value;`,
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
