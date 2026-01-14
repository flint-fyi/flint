import rule from "./implicitGlobals.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
var globalVariable = 42;
`,
			snapshot: `
var globalVariable = 42;
    ~~~~~~~~~~~~~~
    This var declaration creates an implicit global variable in browser scripts.
`,
		},
		{
			code: `
function globalFunction() {
    return true;
}
`,
			snapshot: `
function globalFunction() {
         ~~~~~~~~~~~~~~
         This function declaration creates an implicit global variable in browser scripts.
    return true;
}
`,
		},
		{
			code: `
var first = 1, second = 2;
`,
			snapshot: `
var first = 1, second = 2;
    ~~~~~
    This var declaration creates an implicit global variable in browser scripts.
               ~~~~~~
               This var declaration creates an implicit global variable in browser scripts.
`,
		},
		{
			code: `
var value;
`,
			snapshot: `
var value;
    ~~~~~
    This var declaration creates an implicit global variable in browser scripts.
`,
		},
		{
			code: `
function firstFunction() {}
function secondFunction() {}
`,
			snapshot: `
function firstFunction() {}
         ~~~~~~~~~~~~~
         This function declaration creates an implicit global variable in browser scripts.
function secondFunction() {}
         ~~~~~~~~~~~~~~
         This function declaration creates an implicit global variable in browser scripts.
`,
		},
	],
	valid: [
		`const value = 42;`,
		`let value = 42;`,
		`
			{
			    var blockScoped = 5;
			}
		`,
		`
			export var exportedVariable = 42;
		`,
		`
			export function exportedFunction() {
			    return true;
			}
		`,
		`
			import { something } from "module";
			var afterImport = 42;
		`,
		`
			const value = 42;
			export { value };
		`,
		`
			export default function() {
			    return true;
			}
		`,
	],
});
