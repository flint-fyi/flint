import rule from "./forInGuards.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
declare const object: Record<string, boolean>;
declare function doSomething(key: string): void;
for (const key in object) {
    doSomething(key);
}
`,
			snapshot: `
declare const object: Record<string, boolean>;
declare function doSomething(key: string): void;
for (const key in object) {
~~~~~~~~~~~~~~~~~~~~~~~~~~
For-in loop body should be wrapped in an if statement to filter inherited properties.
    doSomething(key);
}
`,
		},
		{
			code: `
declare const object: Record<string, boolean>;
declare function doSomething(key: string): void;
for (const key in object) doSomething(key);
`,
			snapshot: `
declare const object: Record<string, boolean>;
declare function doSomething(key: string): void;
for (const key in object) doSomething(key);
~~~~~~~~~~~~~~~~~~~~~~~~~~
For-in loop body should be wrapped in an if statement to filter inherited properties.
`,
		},
		{
			code: `
declare const condition: boolean;
declare const object: Record<string, boolean>;
declare function doSomething(key: string): void;
declare function doSomethingElse(key: string): void;
for (const key in object) {
    if (condition) {
        doSomething(key);
    }
    doSomethingElse(key);
}
`,
			snapshot: `
declare const condition: boolean;
declare const object: Record<string, boolean>;
declare function doSomething(key: string): void;
declare function doSomethingElse(key: string): void;
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
declare const condition: boolean;
declare const object: Record<string, boolean>;
declare function doSomething(key: string): void;
declare function doSomethingElse(key: string): void;
for (const key in object) {
    if (condition) {
        doSomething(key);
        continue;
    }
    doSomethingElse(key);
}
`,
			snapshot: `
declare const condition: boolean;
declare const object: Record<string, boolean>;
declare function doSomething(key: string): void;
declare function doSomethingElse(key: string): void;
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
declare const condition: boolean;
declare const object: Record<string, boolean>;
declare function doSomething(key: string): void;
declare function doSomethingElse(key: string): void;
for (const key in object) {
    if (condition) {
        continue;
        doSomething(key);
    }
    doSomethingElse(key);
}
`,
			snapshot: `
declare const condition: boolean;
declare const object: Record<string, boolean>;
declare function doSomething(key: string): void;
declare function doSomethingElse(key: string): void;
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
		`
declare const object: Record<string, boolean>;
for (const key in object);
`,
		`
declare const object: Record<string, boolean>;
for (const key in object) {}
`,
		`
declare const condition: boolean;
declare const object: Record<string, boolean>;
declare function doSomething(key: string): void;
for (const key in object) if (condition) doSomething(key);
`,
		`
declare const condition: boolean;
declare const object: Record<string, boolean>;
declare function doSomething(key: string): void;
for (const key in object) {
    if (condition) doSomething(key);
}
`,
		`
declare const object: Record<string, boolean>;
declare function doSomething(key: string): void;
for (const key in object) {
    if (Object.hasOwn(object, key)) {
        doSomething(key);
    }
}`,
		`
declare const object: Record<string, boolean>;
declare function doSomething(key: string): void;
for (const key in object) {
    if (Object.prototype.hasOwnProperty.call(object, key)) {
        doSomething(key);
    }
}`,
		`
declare const object: Record<string, boolean>;
declare function doSomething(key: string): void;
for (const key in object) {
    if (!Object.hasOwn(object, key)) continue;
    doSomething(key);
}`,
		`
declare const object: Record<string, boolean>;
declare function doSomething(key: string): void;
for (const key in object) {
    if (!Object.hasOwn(object, key)) {
        continue;
    }
    doSomething(key);
}`,
	],
});
