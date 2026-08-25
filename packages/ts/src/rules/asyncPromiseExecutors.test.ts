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
const p = new Promise<void>(async (resolve) => {
    resolve();
});
p;
`,
			snapshot: `
const p = new Promise<void>(async (resolve) => {
                            ~~~~~
                            Async Promise executor functions are not able to properly catch thrown errors and often indicate unnecessarily complex logic.
    resolve();
});
p;
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
function doSomething() {
    return Promise.resolve();
}

const p = new Promise((resolve) => {
    doSomething().then(resolve);
});
p;
`,
		`
class SomethingElse {
    constructor(executor: (resolve: () => void) => void | Promise<void>) {
        executor(() => {});
    }
}

new SomethingElse(async (resolve) => {
    resolve();
});
`,
	],
});
