import rule from "./arrayConstructors.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
const values = new Array();
`,
			output: `
const values = [];
`,
			snapshot: `
const values = new Array();
               ~~~~~~~~~~~
               Prefer array literal syntax over the \`Array\` constructor.
`,
		},
		{
			code: `
const values = new Array(1, 2, 3);
`,
			output: `
const values = [1, 2, 3];
`,
			snapshot: `
const values = new Array(1, 2, 3);
               ~~~~~~~~~~~~~~~~~~
               Prefer array literal syntax over the \`Array\` constructor.
`,
		},
		{
			code: `
const values = Array();
`,
			output: `
const values = [];
`,
			snapshot: `
const values = Array();
               ~~~~~~~
               Prefer array literal syntax over the \`Array\` constructor.
`,
		},
		{
			code: `
const values = Array(1, 2, 3);
`,
			output: `
const values = [1, 2, 3];
`,
			snapshot: `
const values = Array(1, 2, 3);
               ~~~~~~~~~~~~~~
               Prefer array literal syntax over the \`Array\` constructor.
`,
		},
		{
			code: `
const values = new Array("a", "b");
`,
			output: `
const values = ["a", "b"];
`,
			snapshot: `
const values = new Array("a", "b");
               ~~~~~~~~~~~~~~~~~~~
               Prefer array literal syntax over the \`Array\` constructor.
`,
		},
	],
	valid: [
		`const values = [];`,
		`const values = [1, 2, 3];`,
		`const values = new Array(10);`,
		`const values = Array(10);`,
		`const values = new Array<number>();`,
		`const values = new Array<number>(1, 2, 3);`,
		`const values = Array<string>();`,
		`const values = new CustomArray();`,
		`const values = CustomArray(1, 2, 3);`,
		`
class Array { constructor() {} }
const values = new Array();
export {};
`,
		`
function Array() { return []; }
const values = Array();
export {};
`,
		`
function Array(...args: number[]) { return args; }
const values = Array(1, 2, 3);
export {};
`,
		`
const Array = () => [];
const values = Array();
export {};
`,
	],
});
