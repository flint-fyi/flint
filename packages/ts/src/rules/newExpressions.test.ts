import rule from "./newExpressions.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
new MyClass();
`,
			snapshot: `
new MyClass();
~~~
Constructors should only be called when their return value is used.
`,
		},
		{
			code: `
function process() {
    new EventEmitter();
}
`,
			snapshot: `
function process() {
    new EventEmitter();
    ~~~
    Constructors should only be called when their return value is used.
}
`,
		},
		{
			code: `
if (condition) {
    new Logger();
}
`,
			snapshot: `
if (condition) {
    new Logger();
    ~~~
    Constructors should only be called when their return value is used.
}
`,
		},
		{
			code: `
new DatabaseConnection(), processData();
`,
			snapshot: `
new DatabaseConnection(), processData();
~~~
Constructors should only be called when their return value is used.
`,
		},
		{
			code: `
someFunction(), new Queue();
`,
			snapshot: `
someFunction(), new Queue();
                ~~~
                Constructors should only be called when their return value is used.
`,
		},
	],
	valid: [
		`const instance = new MyClass();`,
		`let value = new MyClass();`,
		`const result = condition ? new MyClass() : new OtherClass();`,
		`return new MyClass();`,
		`throw new Error("message");`,
		`function create() { return new MyClass(); }`,
		`const array = [new MyClass(), new OtherClass()];`,
		`const object = { value: new MyClass() };`,
		`myFunction(new MyClass());`,
		`new MyClass().method();`,
		`const value = new MyClass() || fallback;`,
		`const value = new MyClass() && other;`,
		`const value = new MyClass() ?? fallback;`,
	],
});
