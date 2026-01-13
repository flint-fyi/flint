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
if (condition) {
    doSomething();
    {
        const nested = true;
    }
}
`,
			snapshot: `
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
    console.log("standalone");
}
`,
			snapshot: `
{
~
This standalone block statement is unnecessary and doesn't change any variable scopes.
    console.log("standalone");
}
`,
		},
		{
			code: `
function outer() {
    {
        console.log("inner");
    }
    {
        console.log("another");
    }
}
`,
			snapshot: `
function outer() {
    {
    ~
    This standalone block statement is unnecessary and doesn't change any variable scopes.
        console.log("inner");
    }
    {
    ~
    This standalone block statement is unnecessary and doesn't change any variable scopes.
        console.log("another");
    }
}
`,
		},
	],
	valid: [
		`if (condition) { doSomething(); }`,
		`for (let i = 0; i < 10; i++) { console.log(i); }`,
		`while (condition) { doWork(); }`,
		`do { doWork(); } while (condition);`,
		`function test() { return 42; }`,
		`const arrow = () => { return 1; };`,
		`
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
for (const item of items) {
    processItem(item);
}
`,
		`
for (const key in object) {
    processKey(key);
}
`,
		`
label: {
    break label;
}
`,
	],
});
