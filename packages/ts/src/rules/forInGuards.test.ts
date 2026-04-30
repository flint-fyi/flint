import rule from "./forInGuards.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
for (const key in object) {
    doSomething(key);
}
`,
			snapshot: `
for (const key in object) {
~~~~~~~~~~~~~~~~~~~~~~~~~~
For-in loop body should be wrapped in an if statement to filter inherited properties.
    doSomething(key);
}
`,
		},
		{
			code: `
for (const key in object) doSomething(key);
`,
			snapshot: `
for (const key in object) doSomething(key);
~~~~~~~~~~~~~~~~~~~~~~~~~~
For-in loop body should be wrapped in an if statement to filter inherited properties.
`,
		},
		{
			code: `
for (const key in object) {
    if (condition) {
        doSomething(key);
    }
    doSomethingElse(key);
}
`,
			snapshot: `
for (const key in object) {
~~~~~~~~~~~~~~~~~~~~~~~~~~
For-in loop body should be wrapped in an if statement to filter inherited properties.
    if (condition) {
        doSomething(key);
    }
    doSomethingElse(key);
}
`,
		},
		{
			code: `
for (const key in object) {
    if (condition) {
        doSomething(key);
        continue;
    }
    doSomethingElse(key);
}
`,
			snapshot: `
for (const key in object) {
~~~~~~~~~~~~~~~~~~~~~~~~~~
For-in loop body should be wrapped in an if statement to filter inherited properties.
    if (condition) {
        doSomething(key);
        continue;
    }
    doSomethingElse(key);
}
`,
		},
		{
			code: `
for (const key in object) {
    if (condition) {
        continue;
        doSomething(key);
    }
    doSomethingElse(key);
}
`,
			snapshot: `
for (const key in object) {
~~~~~~~~~~~~~~~~~~~~~~~~~~
For-in loop body should be wrapped in an if statement to filter inherited properties.
    if (condition) {
        continue;
        doSomething(key);
    }
    doSomethingElse(key);
}
`,
		},
	],
	valid: [
		`for (const key in object);`,
		`for (const key in object) {}`,
		`for (const key in object) if (condition) doSomething(key);`,
		`for (const key in object) { if (condition) doSomething(key); }`,
		`
for (const key in object) {
    if (Object.hasOwn(object, key)) {
        doSomething(key);
    }
}`,
		`
for (const key in object) {
    if (Object.prototype.hasOwnProperty.call(object, key)) {
        doSomething(key);
    }
}`,
		`
for (const key in object) {
    if (!Object.hasOwn(object, key)) continue;
    doSomething(key);
}`,
		`
for (const key in object) {
    if (!Object.hasOwn(object, key)) {
        continue;
    }
    doSomething(key);
}`,
	],
});
