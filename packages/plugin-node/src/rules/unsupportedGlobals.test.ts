import nodePath from "node:path";

import { ruleTester } from "./ruleTester.ts";
import rule from "./unsupportedGlobals.ts";

const testDir = nodePath.dirname(import.meta.filename);
const oldNodeDir = nodePath.join(testDir, "fixtures/unsupportedGlobals-old");
const newNodeDir = nodePath.join(testDir, "fixtures/unsupportedGlobals-new");
const noEnginesDir = nodePath.join(
	testDir,
	"fixtures/unsupportedGlobals-no-engines",
);
const oldNodeFile = nodePath.join(oldNodeDir, "test.ts");
const newNodeFile = nodePath.join(newNodeDir, "test.ts");
const noEnginesFile = nodePath.join(noEnginesDir, "test.ts");

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
const registry = new FinalizationRegistry(() => {});
`,
			fileName: oldNodeFile,
			snapshot: `
const registry = new FinalizationRegistry(() => {});
                     ~~~~~~~~~~~~~~~~~~~~
                     "FinalizationRegistry" is not supported until Node.js 14.6.0. The configured version range is ">=10.0.0".
`,
		},
		{
			code: `
const ref = new WeakRef({});
`,
			fileName: oldNodeFile,
			snapshot: `
const ref = new WeakRef({});
                ~~~~~~~
                "WeakRef" is not supported until Node.js 14.6.0. The configured version range is ">=10.0.0".
`,
		},
		{
			code: `
console.log(globalThis);
`,
			fileName: oldNodeFile,
			snapshot: `
console.log(globalThis);
            ~~~~~~~~~~
            "globalThis" is not supported until Node.js 12.0.0. The configured version range is ">=10.0.0".
`,
		},
		{
			code: `
const error = new AggregateError([new Error("error1")]);
`,
			fileName: oldNodeFile,
			snapshot: `
const error = new AggregateError([new Error("error1")]);
                  ~~~~~~~~~~~~~~
                  "AggregateError" is not supported until Node.js 15.0.0. The configured version range is ">=10.0.0".
`,
		},
	],
	valid: [
		// New Node.js version - all features supported
		{
			code: `const registry = new FinalizationRegistry(() => {});`,
			fileName: newNodeFile,
		},
		{ code: `const ref = new WeakRef({});`, fileName: newNodeFile },
		{ code: `console.log(globalThis);`, fileName: newNodeFile },
		{ code: `const error = new AggregateError([]);`, fileName: newNodeFile },
		// No engines field - no restrictions
		{
			code: `const finReg = new FinalizationRegistry((value) => console.log(value));`,
			fileName: noEnginesFile,
		},
		{
			code: `const weakReference = new WeakRef({ data: 1 });`,
			fileName: noEnginesFile,
		},
		// Features supported on old Node (10.0.0)
		{ code: `const arr = new Atomics();`, fileName: newNodeFile },
		{ code: `const promise = Promise.resolve();`, fileName: oldNodeFile },
		{ code: `const map = new Map();`, fileName: oldNodeFile },
		{ code: `const set = new Set();`, fileName: oldNodeFile },
		{ code: `const proxy = new Proxy({}, {});`, fileName: oldNodeFile },
		{ code: `const reflect = Reflect.get({}, "key");`, fileName: oldNodeFile },
		{ code: `const symbol = Symbol("test");`, fileName: oldNodeFile },
		// Type references should not be flagged
		{ code: `type Ref = WeakRef<object>;`, fileName: oldNodeFile },
		{
			code: `const value: FinalizationRegistry<object> = null!;`,
			fileName: oldNodeFile,
		},
		// Property access should not be flagged
		{ code: `const x = obj.WeakRef;`, fileName: oldNodeFile },
		// Variable declarations with same name should not be flagged
		{ code: `const WeakRef = class {};`, fileName: oldNodeFile },
	],
});
