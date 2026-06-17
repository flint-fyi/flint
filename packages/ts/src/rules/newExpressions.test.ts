import rule from "./newExpressions.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
class MyClass {}

new MyClass();
`,
			snapshot: `
class MyClass {}

new MyClass();
~~~
Constructors should only be called when their return value is used.
`,
		},
		{
			code: `
class EventEmitter {}

function process() {
    new EventEmitter();
}
`,
			snapshot: `
class EventEmitter {}

function process() {
    new EventEmitter();
    ~~~
    Constructors should only be called when their return value is used.
}
`,
		},
		{
			code: `
class Logger {}

declare const condition: boolean;

if (condition) {
    new Logger();
}
`,
			snapshot: `
class Logger {}

declare const condition: boolean;

if (condition) {
    new Logger();
    ~~~
    Constructors should only be called when their return value is used.
}
`,
		},
		{
			code: `
class DatabaseConnection {}

declare function processData(): void;

new DatabaseConnection(), processData();
`,
			snapshot: `
class DatabaseConnection {}

declare function processData(): void;

new DatabaseConnection(), processData();
~~~
Constructors should only be called when their return value is used.
`,
		},
		{
			code: `
class Queue {}

declare function someFunction(): void;

someFunction(), new Queue();
`,
			snapshot: `
class Queue {}

declare function someFunction(): void;

someFunction(), new Queue();
                ~~~
                Constructors should only be called when their return value is used.
`,
		},
	],
	valid: [
		`
class MyClass {}

const instance = new MyClass();
`,
		`
class MyClass {}

let value = new MyClass();
`,
		`
class MyClass {}
class OtherClass {}

declare const condition: boolean;

const result = condition ? new MyClass() : new OtherClass();
`,
		`
class MyClass {}

function createValue() {
    return new MyClass();
}
`,
		`throw new Error("message");`,
		`
class MyClass {}

function create() {
    return new MyClass();
}
`,
		`
class MyClass {}
class OtherClass {}

const array = [new MyClass(), new OtherClass()];
`,
		`
class MyClass {}

const object = { value: new MyClass() };
`,
		`
class MyClass {}

declare function myFunction(value: MyClass): void;

myFunction(new MyClass());
`,
		`
class MyClass {
    method() {}
}

new MyClass().method();
`,
		`
class MyClass {}

declare const fallback: MyClass;

const value = new MyClass() || fallback;
`,
		`
class MyClass {}

declare const other: MyClass;

const value = new MyClass() && other;
`,
		`
class MyClass {}

declare const fallback: MyClass;

const value = new MyClass() ?? fallback;
`,
	],
});
