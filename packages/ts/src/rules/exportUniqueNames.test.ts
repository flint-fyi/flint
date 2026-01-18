import rule from "./exportUniqueNames.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
const a = 1;
const b = 2;
export { a };
export { a };
`,
			snapshot: `
const a = 1;
const b = 2;
export { a };
export { a };
         ~
         Duplicate export 'a' found.
`,
		},
		{
			code: `
export const value = 1;
export { value };
`,
			snapshot: `
export const value = 1;
export { value };
         ~~~~~
         Duplicate export 'value' found.
`,
		},
		{
			code: `
export function getValue() { return 1; }
const getValue2 = getValue;
export { getValue2 as getValue };
`,
			snapshot: `
export function getValue() { return 1; }
const getValue2 = getValue;
export { getValue2 as getValue };
                      ~~~~~~~~
                      Duplicate export 'getValue' found.
`,
		},
	],
	valid: [
		`export const a = 1;`,
		`const a = 1; const b = 2; export { a, b };`,
		`export function getValue() { return 1; }`,
		`export { a }; export { b };`,
		`export type MyType = string; export const MyType = 1;`,
	],
});
