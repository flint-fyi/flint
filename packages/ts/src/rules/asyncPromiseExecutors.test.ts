import rule from "./asyncPromiseExecutors.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
new Promise(async (resolve, reject) => {
    resolve(42);
});
`,
			snapshot: `
new Promise(async (resolve, reject) => {
            ~~~~~
            Async Promise executor functions are not able to properly catch thrown errors and often indicate unnecessarily complex logic.
    resolve(42);
});
`,
		},
		{
			code: `
new Promise(async function(resolve, reject) {
    resolve(42);
});
`,
			snapshot: `
new Promise(async function(resolve, reject) {
            ~~~~~
            Async Promise executor functions are not able to properly catch thrown errors and often indicate unnecessarily complex logic.
    resolve(42);
});
`,
		},
		{
			code: `
const p = new Promise(async (resolve) => {
    resolve();
});
`,
			snapshot: `
const p = new Promise(async (resolve) => {
                      ~~~~~
                      Async Promise executor functions are not able to properly catch thrown errors and often indicate unnecessarily complex logic.
    resolve();
});
`,
		},
	],
	valid: [
		`
new Promise((resolve, reject) => {
    resolve(42);
});
`,
		`
new Promise(function(resolve, reject) {
    resolve(42);
});
`,
		`
const p = new Promise((resolve) => {
    doSomething().then(resolve);
});
`,
		`
// Not a Promise constructor
new SomethingElse(async (resolve) => {
    resolve();
});
`,
	],
});
