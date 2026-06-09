import rule from "./awaitThenable.ts";
import { domLibRuleTester } from "./ruleTester.ts";

domLibRuleTester.describe(rule, {
	invalid: [
		{
			code: `
async function getValue() {
    const value = 42;
    return await value;
}
`,
			snapshot: `
async function getValue() {
    const value = 42;
    return await value;
           ~~~~~
           Awaiting a non-Promise (non-Thenable) value is unnecessary and indicates a likely mistake.
}
`,
		},
		{
			code: `
async function getString() {
    return await "hello";
}
`,
			snapshot: `
async function getString() {
    return await "hello";
           ~~~~~
           Awaiting a non-Promise (non-Thenable) value is unnecessary and indicates a likely mistake.
}
`,
		},
		{
			code: `
async function getObject() {
    const obj = { key: "value" };
    return await obj;
}
`,
			snapshot: `
async function getObject() {
    const obj = { key: "value" };
    return await obj;
           ~~~~~
           Awaiting a non-Promise (non-Thenable) value is unnecessary and indicates a likely mistake.
}
`,
		},
		{
			code: `
async function example() {
    await null;
}
`,
			snapshot: `
async function example() {
    await null;
    ~~~~~
    Awaiting a non-Promise (non-Thenable) value is unnecessary and indicates a likely mistake.
}
`,
		},
		{
			code: `
async function example() {
    await undefined;
}
`,
			snapshot: `
async function example() {
    await undefined;
    ~~~~~
    Awaiting a non-Promise (non-Thenable) value is unnecessary and indicates a likely mistake.
}
`,
		},
		{
			code: `
async function processItems() {
    const items = [1, 2, 3];
    for await (const item of items) {
        console.log(item);
    }
}
`,
			snapshot: `
async function processItems() {
    const items = [1, 2, 3];
    for await (const item of items) {
        ~~~~~
        Using \`for await...of\` on a value that is not async iterable is unnecessary.
        console.log(item);
    }
}
`,
		},
		{
			code: `
async function processStrings() {
    for await (const char of "hello") {
        console.log(char);
    }
}
`,
			snapshot: `
async function processStrings() {
    for await (const char of "hello") {
        ~~~~~
        Using \`for await...of\` on a value that is not async iterable is unnecessary.
        console.log(char);
    }
}
`,
		},
	],
	valid: [
		`
async function fetchData() {
    const data = await fetch("/api");
    return data;
}
`,
		`
async function waitForPromise() {
    const promise = Promise.resolve(42);
    return await promise;
}
`,
		`
async function awaitThenable() {
    const thenable = { then: (resolve: (value: number) => void) => resolve(42) };
    return await thenable;
}
`,
		`
async function awaitAny(value: any) {
    return await value;
}
`,
		`
async function* asyncGenerator() {
    yield 1;
    yield 2;
}
async function iterateAsync() {
    for await (const value of asyncGenerator()) {
        console.log(value);
    }
}
`,
		`
async function processReadable(stream: AsyncIterable<string>) {
    for await (const chunk of stream) {
        console.log(chunk);
    }
}
`,
	],
});
