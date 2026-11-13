import rule from "./exportUniqueNames.ts";
import { javascriptRuleTester } from "./ruleTester.ts";

javascriptRuleTester.describe(rule, {
	invalid: [
		{
			files: {
				"file.js": `
const a = 1;
const b = 2;
export { a };
export { a };
`,
			},
			snapshot: {
				"file.js": `
const a = 1;
const b = 2;
export { a };
export { a };
         ~
         Duplicate export 'a' found.
`,
			},
		},
		{
			files: {
				"file.js": `
export const value = 1;
export { value };
`,
			},
			snapshot: {
				"file.js": `
export const value = 1;
export { value };
         ~~~~~
         Duplicate export 'value' found.
`,
			},
		},
		{
			files: {
				"file.js": `
export function getValue() { return 1; }
const getValue2 = getValue;
export { getValue2 as getValue };
`,
			},
			snapshot: {
				"file.js": `
export function getValue() { return 1; }
const getValue2 = getValue;
export { getValue2 as getValue };
                      ~~~~~~~~
                      Duplicate export 'getValue' found.
`,
			},
		},
	],
	valid: [
		{
			files: {
				"file.js": `export const a = 1;`,
			},
		},
		{
			files: {
				"file.js": `const a = 1; const b = 2; export { a, b };`,
			},
		},
		{
			files: {
				"file.js": `export function getValue() { return 1; }`,
			},
		},
		{
			files: {
				"file.js": `const a = 1; const b = 2; export { a }; export { b };`,
			},
		},
	],
});
