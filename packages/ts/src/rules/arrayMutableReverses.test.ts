import rule from "./arrayMutableReverses.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
const values: number[] = [1, 2, 3];
const reversed = values.reverse();
`,
			output: `
const values: number[] = [1, 2, 3];
const reversed = values.toReversed();
`,
			snapshot: `
const values: number[] = [1, 2, 3];
const reversed = values.reverse();
                        ~~~~~~~~~
                        Use \`.toReversed()\` instead of \`.reverse()\` to avoid mutating the original array.
`,
		},
		{
			code: `
const items: string[] = ["a", "b", "c"];
declare function doSomething(value: string[]): void;

doSomething(items.reverse());
`,
			output: `
const items: string[] = ["a", "b", "c"];
declare function doSomething(value: string[]): void;

doSomething(items.toReversed());
`,
			snapshot: `
const items: string[] = ["a", "b", "c"];
declare function doSomething(value: string[]): void;

doSomething(items.reverse());
                  ~~~~~~~~~
                  Use \`.toReversed()\` instead of \`.reverse()\` to avoid mutating the original array.
`,
		},
		{
			code: `
function reverseValues() {
    const values: number[] = [1, 2, 3];

    return values.reverse();
}
`,
			output: `
function reverseValues() {
    const values: number[] = [1, 2, 3];

    return values.toReversed();
}
`,
			snapshot: `
function reverseValues() {
    const values: number[] = [1, 2, 3];

    return values.reverse();
                  ~~~~~~~~~
                  Use \`.toReversed()\` instead of \`.reverse()\` to avoid mutating the original array.
}
`,
		},
	],
	valid: [
		`const values: number[] = [1, 2, 3]; const reversed = values.toReversed();`,
		`const values: number[] = [1, 2, 3]; values.reverse();`,
		`
const values: number[] = [1, 2, 3];
declare function doSomething(value: number[]): void;

values.reverse();
doSomething(values);
`,
		`const obj = { reverse: () => "test" }; const result = obj.reverse();`,
		`function test(arr: number[]) { arr.reverse(); }`,
	],
});
