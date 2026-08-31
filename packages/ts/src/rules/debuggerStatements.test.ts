import rule from "./debuggerStatements.ts";
import { domLibRuleTester } from "./ruleTester.ts";

domLibRuleTester.describe(rule, {
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
declare const condition: boolean;

if (condition) {
	debugger;
}
`,
			snapshot: `
declare const condition: boolean;

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
declare const condition: boolean;

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
