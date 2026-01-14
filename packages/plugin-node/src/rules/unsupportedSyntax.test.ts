import nodePath from "node:path";

import { ruleTester } from "./ruleTester.ts";
import rule from "./unsupportedSyntax.ts";

const testDir = nodePath.dirname(import.meta.filename);
const oldNodeDir = nodePath.join(testDir, "fixtures/unsupportedSyntax-old");
const newNodeDir = nodePath.join(testDir, "fixtures/unsupportedSyntax-new");
const oldNodeFile = nodePath.join(oldNodeDir, "test.ts");
const newNodeFile = nodePath.join(newNodeDir, "test.ts");

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
const value = obj?.property;
`,
			fileName: oldNodeFile,
			snapshot: `
const value = obj?.property;
                 ~~
                 optional chaining (?.) is not supported until Node.js 14.0.0. The configured version range is ">=12.0.0".
`,
		},
		{
			code: `
const result = value ?? defaultValue;
`,
			fileName: oldNodeFile,
			snapshot: `
const result = value ?? defaultValue;
                     ~~
                     nullish coalescing operator (??) is not supported until Node.js 14.0.0. The configured version range is ">=12.0.0".
`,
		},
		{
			code: `
let count = 0;
count ||= 1;
`,
			fileName: oldNodeFile,
			snapshot: `
let count = 0;
count ||= 1;
      ~~~
      logical assignment operators (&&=, ||=, ??=) is not supported until Node.js 15.0.0. The configured version range is ">=12.0.0".
`,
		},
		{
			code: `
class Example {
    static {
        console.log("init");
    }
}
`,
			fileName: oldNodeFile,
			snapshot: `
class Example {
    static {
    ~~~~~~~~
    class static blocks is not supported until Node.js 16.11.0. The configured version range is ">=12.0.0".
        console.log("init");
        ~~~~~~~~~~~~~~~~~~~~
    }
    ~
}
`,
		},
	],
	valid: [
		// New Node.js version - all features supported
		{ code: `const value = obj?.property;`, fileName: newNodeFile },
		{ code: `const result = value ?? defaultValue;`, fileName: newNodeFile },
		{ code: `count ||= 1;`, fileName: newNodeFile },
		{
			code: `class Example { static { console.log("init"); } }`,
			fileName: newNodeFile,
		},
		// Features supported on old Node (12.0.0)
		{
			code: `async function doSomething() { await fetch(); }`,
			fileName: oldNodeFile,
		},
		{
			code: `class Example { field = 1; }`,
			fileName: oldNodeFile,
		},
		// Numeric separators on new Node.js
		{ code: `const num = 1_000_000;`, fileName: newNodeFile },
	],
});
