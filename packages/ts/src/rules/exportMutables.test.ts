import rule from "./exportMutables.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
export let counter = 0;
`,
			snapshot: `
export let counter = 0;
           ~~~~~~~
           Exported variable 'counter' is mutable. Use const instead.
`,
		},
		{
			code: `
export var name = "test";
`,
			snapshot: `
export var name = "test";
           ~~~~
           Exported variable 'name' is mutable. Use const instead.
`,
		},
		{
			code: `
export let a = 1, b = 2;
`,
			snapshot: `
export let a = 1, b = 2;
           ~
           Exported variable 'a' is mutable. Use const instead.
                  ~
                  Exported variable 'b' is mutable. Use const instead.
`,
		},
	],
	valid: [
		`export const value = 42;`,
		`export const items = [];`,
		`let counter = 0; export { counter };`,
		`export function increment() { return counter++; }`,
		`export class Counter { value = 0; }`,
	],
});
