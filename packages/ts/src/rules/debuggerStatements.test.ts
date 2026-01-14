import rule from "./debuggerStatements.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
debugger;
`,
			snapshot: `
debugger;
~~~~~~~~~
Debugger statements should not be used in production code.
`,
			suggestions: [
				{
					id: "removeDebugger",
					updated: `

`,
				},
			],
		},
		{
			code: `
function test() {
	debugger;
}
`,
			snapshot: `
function test() {
	debugger;
	~~~~~~~~~
	Debugger statements should not be used in production code.
}
`,
			suggestions: [
				{
					id: "removeDebugger",
					updated: `
function test() {
	
}
`,
				},
			],
		},
		{
			code: `
if (condition) {
	debugger;
}
`,
			snapshot: `
if (condition) {
	debugger;
	~~~~~~~~~
	Debugger statements should not be used in production code.
}
`,
			suggestions: [
				{
					id: "removeDebugger",
					updated: `
if (condition) {
	
}
`,
				},
			],
		},
	],
	valid: [
		`console.log("debugging");`,
		`function test() { console.log("test"); }`,
		`for (let i = 0; i < 10; i++) { break; }`,
		`for (let i = 0; i < 10; i++) { continue; }`,
		`function test() { return; }`,
		`throw new Error("test");`,
	],
});
