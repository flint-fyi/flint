import { ruleTester } from "./ruleTester.ts";
import rule from "./unnecessaryBlocks.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
{
    const x = 1;
}
`,
			snapshot: `
{
~
This standalone block statement is unnecessary and doesn't change any variable scopes.
    const x = 1;
}
`,
		},
		{
			code: `
function test() {
    {
        const y = 2;
    }
}
`,
			snapshot: `
function test() {
    {
    ~
    This standalone block statement is unnecessary and doesn't change any variable scopes.
        const y = 2;
    }
}
`,
		},
		{
			code: `
declare const condition: boolean;
declare function doSomething(): void;

if (condition) {
    doSomething();
    {
        const nested = true;
    }
}
`,
			snapshot: `
declare const condition: boolean;
declare function doSomething(): void;

if (condition) {
    doSomething();
    {
    ~
    This standalone block statement is unnecessary and doesn't change any variable scopes.
        const nested = true;
    }
}
`,
		},
		{
			code: `
{
    const message = "standalone";
    void message;
}
`,
			snapshot: `
{
~
This standalone block statement is unnecessary and doesn't change any variable scopes.
    const message = "standalone";
    void message;
}
`,
		},
		{
			code: `
function outer() {
    {
        const message = "inner";
        void message;
    }
    {
        const message = "another";
        void message;
    }
}
outer();
`,
			snapshot: `
function outer() {
    {
    ~
    This standalone block statement is unnecessary and doesn't change any variable scopes.
        const message = "inner";
        void message;
    }
    {
    ~
    This standalone block statement is unnecessary and doesn't change any variable scopes.
        const message = "another";
        void message;
    }
}
outer();
`,
		},
	],
	valid: [
		`
declare const condition: boolean;
declare function doSomething(): void;

if (condition) { doSomething(); }
`,
		`for (let i = 0; i < 10; i++) { void i; }`,
		`
declare const condition: boolean;
declare function doWork(): void;

while (condition) { doWork(); }
`,
		`
declare const condition: boolean;
declare function doWork(): void;

do { doWork(); } while (condition);
`,
		`function test() { return 42; }`,
		`const arrow = () => { return 1; };`,
		`
declare const value: number;

switch (value) {
    case 1: {
        const x = 1;
        break;
    }
    case 2: {
        const y = 2;
        break;
    }
}
`,
		`
declare function doSomething(): void;
declare function handleError(error: unknown): void;

try {
    doSomething();
} catch (error) {
    handleError(error);
}
`,
		`
class MyClass {
    method() {
        return 1;
    }
}
`,
		`
declare const items: readonly string[];
declare function processItem(item: string): void;

for (const item of items) {
    processItem(item);
}
`,
		`
declare const object: object;
declare function processKey(key: string): void;

for (const key in object) {
    processKey(key);
}
`,
		`
label: {
    break label;
}
`,
		`
{
  using _ = { [Symbol.dispose]: () => { } };
}
`,
		`
async function run() {
  {
    await using _ = { [Symbol.asyncDispose]: () => Promise.resolve() };
  }
}
run();
`,
	],
});
