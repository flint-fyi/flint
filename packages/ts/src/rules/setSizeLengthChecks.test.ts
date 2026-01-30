import { ruleTester } from "./ruleTester.ts";
import rule from "./setSizeLengthChecks.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
const count = [...new Set(items)].length;
`,
			snapshot: `
const count = [...new Set(items)].length;
              ~~~~~~~~~~~~~~~~~~~~~~~~~~
              Prefer \`Set.size\` instead of spreading into an array and accessing \`.length\`.
`,
		},
		{
			code: `
const uniqueItems = new Set([1, 2, 3]);
const count = [...uniqueItems].length;
`,
			snapshot: `
const uniqueItems = new Set([1, 2, 3]);
const count = [...uniqueItems].length;
              ~~~~~~~~~~~~~~~~~~~~~~~
              Prefer \`Set.size\` instead of spreading into an array and accessing \`.length\`.
`,
		},
		{
			code: `
const count = [...(new Set(items))].length;
`,
			snapshot: `
const count = [...(new Set(items))].length;
              ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
              Prefer \`Set.size\` instead of spreading into an array and accessing \`.length\`.
`,
		},
		{
			code: `
const count = [
    ...new Set(items)
].length;
`,
			snapshot: `
const count = [
              ~
              Prefer \`Set.size\` instead of spreading into an array and accessing \`.length\`.
    ...new Set(items)
    ~~~~~~~~~~~~~~~~~
].length;
~~~~~~~~
`,
		},
		{
			code: `
const result = [...new Set(items)].length + extra;
`,
			snapshot: `
const result = [...new Set(items)].length + extra;
               ~~~~~~~~~~~~~~~~~~~~~~~~~~
               Prefer \`Set.size\` instead of spreading into an array and accessing \`.length\`.
`,
		},
	],
	valid: [
		`new Set(items).size`,
		`const uniqueItems = new Set(items); uniqueItems.size`,
		`[...items].length`,
		`[...new Set(items), extra].length`,
		`[...new Set(items)]?.length`,
		`[...new Set(items)].notLength`,
		`let items = new Set([]); [...items].length`,
		`
class Set {
    constructor(items: unknown[]) {}
    length = 0;
}
const count = [...new Set(items)].length;
export {};
`,
	],
});
