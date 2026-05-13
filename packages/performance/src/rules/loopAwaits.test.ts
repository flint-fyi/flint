import rule from "./loopAwaits.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
async function example() {
    for (let i = 0; i < 10; i++) {
        await doSomething();
    }
}
`,
			snapshot: `
async function example() {
    for (let i = 0; i < 10; i++) {
        await doSomething();
        ~~~~~
        Using await inside loops causes sequential execution instead of parallel execution.
    }
}
`,
		},
		{
			code: `
async function example() {
    const items = [1, 2, 3];
    for (const item of items) {
        await process(item);
    }
}
`,
			snapshot: `
async function example() {
    const items = [1, 2, 3];
    for (const item of items) {
        await process(item);
        ~~~~~
        Using await inside loops causes sequential execution instead of parallel execution.
    }
}
`,
		},
		{
			code: `
async function example() {
    const items = { a: 1, b: 2 };
    for (const key in items) {
        await process(items[key]);
    }
}
`,
			snapshot: `
async function example() {
    const items = { a: 1, b: 2 };
    for (const key in items) {
        await process(items[key]);
        ~~~~~
        Using await inside loops causes sequential execution instead of parallel execution.
    }
}
`,
		},
		{
			code: `
async function example() {
    let i = 0;
    while (i < 10) {
        await doSomething();
        i++;
    }
}
`,
			snapshot: `
async function example() {
    let i = 0;
    while (i < 10) {
        await doSomething();
        ~~~~~
        Using await inside loops causes sequential execution instead of parallel execution.
        i++;
    }
}
`,
		},
		{
			code: `
async function example() {
    let i = 0;
    do {
        await doSomething();
        i++;
    } while (i < 10);
}
`,
			snapshot: `
async function example() {
    let i = 0;
    do {
        await doSomething();
        ~~~~~
        Using await inside loops causes sequential execution instead of parallel execution.
        i++;
    } while (i < 10);
}
`,
		},
		{
			code: `
async function example() {
    for (let i = 0; i < 10; i++) {
        if (condition) {
            await doSomething();
        }
    }
}
`,
			snapshot: `
async function example() {
    for (let i = 0; i < 10; i++) {
        if (condition) {
            await doSomething();
            ~~~~~
            Using await inside loops causes sequential execution instead of parallel execution.
        }
    }
}
`,
		},
		{
			code: `
async function example() {
    for (let i = 0; i < 10; i++) {
        const result = await foo();
    }
}
`,
			snapshot: `
async function example() {
    for (let i = 0; i < 10; i++) {
        const result = await foo();
                       ~~~~~
                       Using await inside loops causes sequential execution instead of parallel execution.
    }
}
`,
		},
	],
	valid: [
		`
async function example() {
    const promises = [];
    for (let i = 0; i < 10; i++) {
        promises.push(doSomething());
    }
    await Promise.all(promises);
}
`,
		`
async function example() {
    for (let i = 0; i < 10; i++) {
        doSomething();
    }
}
`,
		`
function example() {
    for (let i = 0; i < 10; i++) {
        const fn = async () => {
            await doSomething();
        };
    }
}
`,
		`
async function example() {
    for (let i = 0; i < 10; i++) {
        const fn = async () => {
            await doSomething();
        };
    }
}
`,
		`
async function example() {
    const items = [1, 2, 3];
    await Promise.all(items.map(async (item) => {
        await process(item);
    }));
}
`,
	],
});
