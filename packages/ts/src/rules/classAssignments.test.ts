import rule from "./classAssignments.ts";
import { javascriptRuleTester } from "./ruleTester.ts";

javascriptRuleTester.describe(rule, {
	invalid: [
		{
			files: {
				"file.js": `
class A {}
A = 0;
`,
			},
			snapshot: {
				"file.js": `
class A {}
A = 0;
~
Reassigning a class declaration is misleading and makes the class harder to use.
`,
			},
		},
	],
	valid: [
		{
			files: {
				"file.js": `class A {}`,
			},
		},
		{
			files: {
				"file.js": `class MyClass {} const instance = new MyClass();`,
			},
		},
		{
			files: {
				"file.js": `class Counter {} const value = Counter;`,
			},
		},
		{
			files: {
				"file.js": `class Example {} if (Example) { void Example; }`,
			},
		},
		{
			files: {
				"file.js": `const A = 0;`,
			},
		},
		{
			files: {
				"file.js": `class A {} function inner() { let A = "shadowed"; A = "reassigning shadowed is ok"; }`,
			},
		},
		{
			files: {
				"file.js": `let A = "outer"; { class A {} } A = "reassigning outer is ok";`,
			},
		},
		{
			files: {
				"file.js": `
class MyClass {}
const derived = class extends MyClass {};
`,
			},
		},
		{
			files: {
				"file.js": `
class Base {}
class Derived extends Base {}
`,
			},
		},
		{
			files: {
				"file.js": `
class MyClass {
    property = "";
}
const instance = new MyClass();
instance.property = "value";
`,
			},
		},
	],
});
