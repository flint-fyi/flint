import rule from "./asyncUnnecessaryPromiseWrappers.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
const fn = async () => Promise.resolve("value");
`,
			snapshot: `
const fn = async () => Promise.resolve("value");
                       ~~~~~~~~~~~~~~~~~~~~~~~~
                       Return values in async functions are already wrapped in a \`Promise\`.
`,
		},
		{
			code: `
const fn = async () => Promise.reject(new Error("error"));
`,
			snapshot: `
const fn = async () => Promise.reject(new Error("error"));
                       ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
                       Errors can be thrown directly instead of wrapping in \`Promise.reject()\`.
`,
		},
	],
	valid: [
		`
async function getValue() {
    return 42;
}
`,
		`
async function throwError() {
    throw new Error("failed");
}
`,
		`
function regularFunction() {
    return Promise.resolve(42);
}
`,
		`
const value = Promise.resolve(42);
`,
		`
const promise = new Promise((resolve) => {
    resolve(42);
});
`,
		`
async function nestedResolve() {
    const inner = () => Promise.resolve(42);
    return inner();
}
`,
		`
promise.then((value) => {
    console.log(value);
});
`,
		`
const result = await Promise.resolve(42);
`,
	],
});
