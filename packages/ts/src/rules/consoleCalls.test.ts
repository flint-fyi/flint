import rule from "./consoleCalls.ts";
import { domLibRuleTester } from "./ruleTester.ts";

domLibRuleTester.describe(rule, {
	invalid: [
		{
			code: `
console.log("hello");
`,
			snapshot: `
console.log("hello");
~~~~~~~~~~~~~~~~~~~~
Console method calls should not be used in production code.
`,
		},
		{
			code: `
console.warn("warning");
`,
			snapshot: `
console.warn("warning");
~~~~~~~~~~~~~~~~~~~~~~~
Console method calls should not be used in production code.
`,
		},
		{
			code: `
console.error("error");
`,
			snapshot: `
console.error("error");
~~~~~~~~~~~~~~~~~~~~~~
Console method calls should not be used in production code.
`,
		},
		{
			code: `
console.info("info");
`,
			snapshot: `
console.info("info");
~~~~~~~~~~~~~~~~~~~~
Console method calls should not be used in production code.
`,
		},
		{
			code: `
console.debug("debug");
`,
			snapshot: `
console.debug("debug");
~~~~~~~~~~~~~~~~~~~~~~
Console method calls should not be used in production code.
`,
		},
		{
			code: `
function test() {
	console.log("inside function");
}
`,
			snapshot: `
function test() {
	console.log("inside function");
	~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
	Console method calls should not be used in production code.
}
`,
		},
		{
			code: `
declare const condition: boolean;

if (condition) {
	console.log("conditional");
}
`,
			snapshot: `
declare const condition: boolean;

if (condition) {
	console.log("conditional");
	~~~~~~~~~~~~~~~~~~~~~~~~~~
	Console method calls should not be used in production code.
}
`,
		},
	],
	valid: [
		`debugger;`,
		`
declare function log(message: string): void;
log("not console");
`,
		`
const myConsole = { log(message: string) {} };
myConsole.log("custom logger");
`,
		`
const logger = { log(message: string) {} };
logger.log("custom logger");
`,
		`const console = { log: (message: string) => {} }; console.log("local"); export {};`,
		`function test(console: { log: (msg: string) => void }) { console.log("param"); }`,
		`class Foo { console = { log: (message: string) => {} }; test() { this.console.log("member"); } }`,
	],
});
