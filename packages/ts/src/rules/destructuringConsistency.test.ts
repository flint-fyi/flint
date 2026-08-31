import rule from "./destructuringConsistency.ts";
import { domLibRuleTester } from "./ruleTester.ts";

domLibRuleTester.describe(rule, {
	invalid: [
		{
			code: `
const foo = { a: 1 };
const {a} = foo;
console.log(foo.a);
`,
			snapshot: `
const foo = { a: 1 };
const {a} = foo;
console.log(foo.a);
            ~~~~~
            Use the destructured variable instead of accessing the property again.
`,
			suggestions: [
				{
					id: "useDestructuredVariable",
					updated: `
const foo = { a: 1 };
const {a} = foo;
console.log(a);
`,
				},
			],
		},
		{
			code: `
const data = { text: "test", value: 10 };
const { text, value } = data;
console.log(data.text);
`,
			snapshot: `
const data = { text: "test", value: 10 };
const { text, value } = data;
console.log(data.text);
            ~~~~~~~~~
            Use the destructured variable instead of accessing the property again.
`,
			suggestions: [
				{
					id: "useDestructuredVariable",
					updated: `
const data = { text: "test", value: 10 };
const { text, value } = data;
console.log(text);
`,
				},
			],
		},
		{
			code: `
const config = { port: 3000, host: "localhost" };
const { port } = config;
const url = config.host + ":" + config.port;
`,
			snapshot: `
const config = { port: 3000, host: "localhost" };
const { port } = config;
const url = config.host + ":" + config.port;
                                ~~~~~~~~~~~
                                Use the destructured variable instead of accessing the property again.
`,
			suggestions: [
				{
					id: "useDestructuredVariable",
					updated: `
const config = { port: 3000, host: "localhost" };
const { port } = config;
const url = config.host + ":" + port;
`,
				},
			],
		},
		{
			code: `
const obj = { prop: 1 };
const { prop: renamed } = obj;
console.log(obj.prop);
`,
			snapshot: `
const obj = { prop: 1 };
const { prop: renamed } = obj;
console.log(obj.prop);
            ~~~~~~~~
            Use the destructured variable instead of accessing the property again.
`,
			suggestions: [
				{
					id: "useDestructuredVariable",
					updated: `
const obj = { prop: 1 };
const { prop: renamed } = obj;
console.log(renamed);
`,
				},
			],
		},
		{
			code: `
const foo = { bar: { a: 1 } };
const {a} = foo.bar;
console.log(foo.bar.a);
`,
			snapshot: `
const foo = { bar: { a: 1 } };
const {a} = foo.bar;
console.log(foo.bar.a);
            ~~~~~~~~~
            Use the destructured variable instead of accessing the property again.
`,
			suggestions: [
				{
					id: "useDestructuredVariable",
					updated: `
const foo = { bar: { a: 1 } };
const {a} = foo.bar;
console.log(a);
`,
				},
			],
		},
		{
			code: `
class Foo {
	a = 1;
	method() {
		const {a} = this;
		console.log(this.a);
	}
}
`,
			snapshot: `
class Foo {
	a = 1;
	method() {
		const {a} = this;
		console.log(this.a);
		            ~~~~~~
		            Use the destructured variable instead of accessing the property again.
	}
}
`,
			suggestions: [
				{
					id: "useDestructuredVariable",
					updated: `
class Foo {
	a = 1;
	method() {
		const {a} = this;
		console.log(a);
	}
}
`,
				},
			],
		},
		{
			code: `
const foo = { a: 1 };
const {a} = foo;
function bar() {
	console.log(foo.a);
}
`,
			snapshot: `
const foo = { a: 1 };
const {a} = foo;
function bar() {
	console.log(foo.a);
	            ~~~~~
	            Use the destructured variable instead of accessing the property again.
}
`,
			suggestions: [
				{
					id: "useDestructuredVariable",
					updated: `
const foo = { a: 1 };
const {a} = foo;
function bar() {
	console.log(a);
}
`,
				},
			],
		},
		{
			code: `
const foo = { a: true };
const {a} = foo;
console.log(!foo.a);
`,
			snapshot: `
const foo = { a: true };
const {a} = foo;
console.log(!foo.a);
             ~~~~~
             Use the destructured variable instead of accessing the property again.
`,
			suggestions: [
				{
					id: "useDestructuredVariable",
					updated: `
const foo = { a: true };
const {a} = foo;
console.log(!a);
`,
				},
			],
		},
		{
			code: `
const foo = { a: 1, c: 2 };
const {a, ...b} = foo;
console.log(foo.a);
`,
			snapshot: `
const foo = { a: 1, c: 2 };
const {a, ...b} = foo;
console.log(foo.a);
            ~~~~~
            Use the destructured variable instead of accessing the property again.
`,
			suggestions: [
				{
					id: "useDestructuredVariable",
					updated: `
const foo = { a: 1, c: 2 };
const {a, ...b} = foo;
console.log(a);
`,
				},
			],
		},
		{
			code: `
const foo = { a: { b: 1, c: 2 } };
const {
	a: {
		b
	}
} = foo;
console.log(foo.a.c);
`,
			snapshot: `
const foo = { a: { b: 1, c: 2 } };
const {
	a: {
		b
	}
} = foo;
console.log(foo.a.c);
            ~~~~~
            Use the destructured variable instead of accessing the property again.
`,
		},
	],
	valid: [
		"const obj = { a: 1, b: 2 }; const { a } = obj; console.log(a);",
		"const obj = { a: 1, b: 2 }; const { a } = obj; console.log(obj.b);",
		"const obj = { a: 1, b: 2 }; console.log(obj.a);",
		"const obj = { method: () => {} }; const { method } = obj; obj.method();",
		"const arr = [1, 2, 3]; const [first] = arr; console.log(arr[0]);",
		"const foo = { a: 1, c: 2 }; const {a, ...b} = foo; console.log(foo.c);",
		"const foo = { a: 1, b: 2 }; console.log(foo.a, foo.b);",
		"const foo = 10;",
		"const bar = 10; const foo = bar;",
		"const {toString: foo} = 10;",
		"const {foo} = null! as { foo: number };",
		"const foo = {a: 1, b: 2};",
		"const foo = [{ a: 1 }]; for (const {a} of foo) {}",
		`
const foo = { a: 1, b() {} };
const {a} = foo;
console.log(a, foo.b());
`,
		`
declare function foo(): { a: number; b: number };
const {a} = foo();
console.log(a, foo().b);
`,
		`
const foo = { a: 1 };
const {a} = foo;
console.log(foo);
`,
		`
const foo = { a: 1, b: 2 };
const {a, b} = foo;
console.log(a, b);
`,
		`
const foo = { bar: { a: 1 } };
const {a} = foo.bar;
console.log(foo.bar);
`,
		`
const foo: { a: "a"; [key: string]: number | string } = { a: "a" };
const {a} = foo;
console.log(foo[a]);
`,
		`
const foo = [1];
const [a] = foo;
console.log(foo);
`,
		`
const bar = "item";
const foo = { item: { a: 1 } };
const {a} = foo[bar];
console.log(foo[bar].a);
`,
		`
const foo: { a?: number } = { a: 1 };
const {a} = foo;
delete foo.a;
`,
		`
const foo = { a: { b: 1 } };
const {
	a: {
		b
	}
} = foo;
console.log(b);
`,
		`
declare const foo: { a: { b: number } & (() => { b: number }) };
const {
	a: {
		b
	}
} = foo;
console.log(foo.a().b);
`,
		`
const foo = { a: 1, b: 2 };
function bar() {
	const {a} = foo;
}
function baz() {
console.log(foo.b);
}
`,
		`
const foo = { a: 1 };
const bar = [foo];
for (const foo of bar) {
	const {a} = foo;
}
console.log(foo.a);
`,
		`
let foo = { a: 1 };
const {a} = foo;
foo.a++;
`,
		`
let foo = { a: 1 };
const {a} = foo;
++foo.a;
`,
		`
let foo = { a: 1 };
const {a} = foo;
foo.a += 1;
`,
		`
let foo = { a: 1 };
const {a} = foo;
foo.a = 1;
`,
		`
const foo = { a: 1, b: 2, c: 3 };
const c = 123;
const {a} = foo;
const {b} = foo;
console.log(foo.c);
`,
		`
const foo = { a: 1, b: 2 };
const {a} = foo;
const b = 'bar';
console.log(foo.b);
`,
		`
const foo = { a: 1, b: 2 };
const {a: b} = foo;
console.log(foo.b);
`,
		`
const foo = { a: 1 };
const {a} = foo;
console.log(foo['a']);
`,
		`
const foo = { a: 1 };
const {a} = foo;
const key = 'a';
console.log(foo[key]);
`,
		`
const foo = { a: 1 };
const key = 'a';
const {[key]: value} = foo;
console.log(foo.a);
`,
	],
});
