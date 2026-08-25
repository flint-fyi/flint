import { createRuleTesterTSConfig } from "@flint.fyi/typescript-language";

import rule from "./classAssignments.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
class A {}
A = 0;
`,
			fileName: "file.js",
			files: createRuleTesterTSConfig({
				allowJs: true,
				checkJs: false,
				noEmit: true,
			}),
			snapshot: `
class A {}
A = 0;
~
Reassigning a class declaration is misleading and makes the class harder to use.
`,
		},
	],
	valid: [
		{
			code: `class A {}`,
			fileName: "file.js",
			files: createRuleTesterTSConfig({
				allowJs: true,
				checkJs: false,
				noEmit: true,
			}),
		},
		{
			code: `class MyClass {} const instance = new MyClass();`,
			fileName: "file.js",
			files: createRuleTesterTSConfig({
				allowJs: true,
				checkJs: false,
				noEmit: true,
			}),
		},
		{
			code: `class Counter {} const value = Counter;`,
			fileName: "file.js",
			files: createRuleTesterTSConfig({
				allowJs: true,
				checkJs: false,
				noEmit: true,
			}),
		},
		{
			code: `class Example {} if (Example) { void Example; }`,
			fileName: "file.js",
			files: createRuleTesterTSConfig({
				allowJs: true,
				checkJs: false,
				noEmit: true,
			}),
		},
		{
			code: `const A = 0;`,
			fileName: "file.js",
			files: createRuleTesterTSConfig({
				allowJs: true,
				checkJs: false,
				noEmit: true,
			}),
		},
		{
			code: `class A {} function inner() { let A = "shadowed"; A = "reassigning shadowed is ok"; }`,
			fileName: "file.js",
			files: createRuleTesterTSConfig({
				allowJs: true,
				checkJs: false,
				noEmit: true,
			}),
		},
		{
			code: `let A = "outer"; { class A {} } A = "reassigning outer is ok";`,
			fileName: "file.js",
			files: createRuleTesterTSConfig({
				allowJs: true,
				checkJs: false,
				noEmit: true,
			}),
		},
		{
			code: `
class MyClass {}
const derived = class extends MyClass {};
`,
			fileName: "file.js",
			files: createRuleTesterTSConfig({
				allowJs: true,
				checkJs: false,
				noEmit: true,
			}),
		},
		{
			code: `
class Base {}
class Derived extends Base {}
`,
			fileName: "file.js",
			files: createRuleTesterTSConfig({
				allowJs: true,
				checkJs: false,
				noEmit: true,
			}),
		},
		{
			code: `
class MyClass {
    property = "";
}
const instance = new MyClass();
instance.property = "value";
`,
			fileName: "file.js",
			files: createRuleTesterTSConfig({
				allowJs: true,
				checkJs: false,
				noEmit: true,
			}),
		},
	],
});
