import rule from "./loopAwaits.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
declare function doSomething(): Promise<void>;
async function example() {
    for (let i = 0; i < 10; i++) {
        await doSomething();
    }
}
`,
			snapshot: `
declare function doSomething(): Promise<void>;
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
declare function process(item: unknown): Promise<void>;
async function example() {
    const items = [1, 2, 3];
    for (const item of items) {
        await process(item);
    }
}
`,
			snapshot: `
declare function process(item: unknown): Promise<void>;
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
declare function process(item: unknown): Promise<void>;
async function example() {
    const items: Record<string, number> = { a: 1, b: 2 };
    for (const key in items) {
        await process(items[key]);
    }
}
`,
			snapshot: `
declare function process(item: unknown): Promise<void>;
async function example() {
    const items: Record<string, number> = { a: 1, b: 2 };
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
declare function doSomething(): Promise<void>;
async function example() {
    let i = 0;
    while (i < 10) {
        await doSomething();
        i++;
    }
}
`,
			snapshot: `
declare function doSomething(): Promise<void>;
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
declare function doSomething(): Promise<void>;
async function example() {
    let i = 0;
    do {
        await doSomething();
        i++;
    } while (i < 10);
}
`,
			snapshot: `
declare function doSomething(): Promise<void>;
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
declare const condition: boolean;
declare function doSomething(): Promise<void>;
async function example() {
    for (let i = 0; i < 10; i++) {
        if (condition) {
            await doSomething();
        }
    }
}
`,
			snapshot: `
declare const condition: boolean;
declare function doSomething(): Promise<void>;
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
declare function foo(): Promise<void>;
async function example() {
    for (let i = 0; i < 10; i++) {
        const result = await foo();
    }
}
`,
			snapshot: `
declare function foo(): Promise<void>;
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
declare function doSomething(): Promise<void>;
async function example() {
    const promises = [];
    for (let i = 0; i < 10; i++) {
        promises.push(doSomething());
    }
    await Promise.all(promises);
}
`,
		`
declare function doSomething(): Promise<void>;
async function example() {
    for (let i = 0; i < 10; i++) {
        doSomething();
    }
}
`,
		`
declare function doSomething(): Promise<void>;
function example() {
    for (let i = 0; i < 10; i++) {
        const fn = async () => {
            await doSomething();
        };
    }
}
`,
		`
declare function doSomething(): Promise<void>;
async function example() {
    for (let i = 0; i < 10; i++) {
        const fn = async () => {
            await doSomething();
        };
    }
}
`,
		`
declare function process(item: unknown): Promise<void>;
async function example() {
    const items = [1, 2, 3];
    await Promise.all(items.map(async (item) => {
        await process(item);
    }));
}
`,
	],
});
