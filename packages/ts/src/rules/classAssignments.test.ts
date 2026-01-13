import rule from "./classAssignments.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
class A {}
A = 0;
`,
			snapshot: `
class A {}
A = 0;
~
Reassigning a class declaration is misleading and makes the class harder to use.
`,
		},
		{
			code: `
class MyClass {}
MyClass = "string";
`,
			snapshot: `
class MyClass {}
MyClass = "string";
~~~~~~~
Reassigning a class declaration is misleading and makes the class harder to use.
`,
		},
		{
			code: `
class Counter {}
Counter++;
`,
			snapshot: `
class Counter {}
Counter++;
~~~~~~~
Reassigning a class declaration is misleading and makes the class harder to use.
`,
		},
		{
			code: `
class Value {}
++Value;
`,
			snapshot: `
class Value {}
++Value;
  ~~~~~
  Reassigning a class declaration is misleading and makes the class harder to use.
`,
		},
		{
			code: `
class MyClass {}
MyClass += "suffix";
`,
			snapshot: `
class MyClass {}
MyClass += "suffix";
~~~~~~~
Reassigning a class declaration is misleading and makes the class harder to use.
`,
		},
		{
			code: `
class Example {}
Example ??= null;
`,
			snapshot: `
class Example {}
Example ??= null;
~~~~~~~
Reassigning a class declaration is misleading and makes the class harder to use.
`,
		},
		{
			code: `
class Test {}
Test &&= false;
`,
			snapshot: `
class Test {}
Test &&= false;
~~~~
Reassigning a class declaration is misleading and makes the class harder to use.
`,
		},
		{
			code: `
class Data {}
Data ||= null;
`,
			snapshot: `
class Data {}
Data ||= null;
~~~~
Reassigning a class declaration is misleading and makes the class harder to use.
`,
		},
		{
			code: `
class Outer {}
function inner() {
    Outer = null;
}
`,
			snapshot: `
class Outer {}
function inner() {
    Outer = null;
    ~~~~~
    Reassigning a class declaration is misleading and makes the class harder to use.
}
`,
		},
		{
			code: `
class MyClass {}
if (true) {
    MyClass = null;
}
`,
			snapshot: `
class MyClass {}
if (true) {
    MyClass = null;
    ~~~~~~~
    Reassigning a class declaration is misleading and makes the class harder to use.
}
`,
		},
	],
	valid: [
		`class A {}`,
		`class MyClass {} const instance = new MyClass();`,
		`class Counter {} const value = Counter;`,
		`class Example {} if (Example) { console.log(Example); }`,
		`const A = 0;`,
		`class A {} function inner() { const A = "shadowed"; A = "reassigning shadowed is ok"; }`,
		`let A = "outer"; class A {} A = "reassigning outer is ok";`,
		`
class MyClass {}
const derived = class extends MyClass {};
`,
		`
class Base {}
class Derived extends Base {}
`,
		`
class MyClass {}
const instance = new MyClass();
instance.property = "value";
`,
	],
});
