import rule from "./destructuringConsistency.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
const {a} = foo;
console.log(foo.a);
`,
			snapshot: `
const {a} = foo;
console.log(foo.a);
            ~~~~~
            Use the destructured variable instead of accessing the property again.
`,
			suggestions: [
				{
					id: "useDestructuredVariable",
					updated: `
const {a} = foo;
console.log(a);
`,
				},
			],
		},
		{
			code: `
const data = { name: "test", value: 10 };
const { name, value } = data;
console.log(data.name);
`,
			snapshot: `
const data = { name: "test", value: 10 };
const { name, value } = data;
console.log(data.name);
            ~~~~~~~~~
            Use the destructured variable instead of accessing the property again.
`,
			suggestions: [
				{
					id: "useDestructuredVariable",
					updated: `
const data = { name: "test", value: 10 };
const { name, value } = data;
console.log(name);
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
const {a} = foo.bar;
console.log(foo.bar.a);
`,
			snapshot: `
const {a} = foo.bar;
console.log(foo.bar.a);
            ~~~~~~~~~
            Use the destructured variable instead of accessing the property again.
`,
			suggestions: [
				{
					id: "useDestructuredVariable",
					updated: `
const {a} = foo.bar;
console.log(a);
`,
				},
			],
		},
		{
			code: `
class Foo {
	method() {
		const {a} = this;
		console.log(this.a);
	}
}
`,
			snapshot: `
class Foo {
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
const {a} = foo;
function bar() {
	console.log(foo.a);
}
`,
			snapshot: `
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
const {a} = foo;
console.log(!foo.a);
`,
			snapshot: `
const {a} = foo;
console.log(!foo.a);
             ~~~~~
             Use the destructured variable instead of accessing the property again.
`,
			suggestions: [
				{
					id: "useDestructuredVariable",
					updated: `
const {a} = foo;
console.log(!a);
`,
				},
			],
		},
		{
			code: `
const {a, ...b} = foo;
console.log(foo.a);
`,
			snapshot: `
const {a, ...b} = foo;
console.log(foo.a);
            ~~~~~
            Use the destructured variable instead of accessing the property again.
`,
			suggestions: [
				{
					id: "useDestructuredVariable",
					updated: `
const {a, ...b} = foo;
console.log(a);
`,
				},
			],
		},
		{
			code: `
const {
	a: {
		b
	}
} = foo;
console.log(foo.a.c);
`,
			snapshot: `
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
		"const {a, ...b} = foo; console.log(foo.c);",
		"console.log(foo.a, foo.b);",
		"const foo = 10;",
		"const foo = bar;",
		"const {foo} = 10;",
		"const {foo} = null;",
		"const foo = {a: 1, b: 2};",
		"for (const {a} of foo) {}",
		`
const {a} = foo;
console.log(a, foo.b());
`,
		`
const {a} = foo();
console.log(a, foo().b);
`,
		`
const {a} = foo;
console.log(foo);
`,
		`
const {a, b} = foo;
console.log(a, b);
`,
		`
const {a} = foo.bar;
console.log(foo.bar);
`,
		`
const {a} = foo;
console.log(foo[a]);
`,
		`
const [a] = foo;
console.log(foo);
`,
		`
const {a} = foo[bar];
console.log(foo[bar].a);
`,
		`
const {a} = foo;
delete foo.a;
`,
		`
const {
	a: {
		b
	}
} = foo;
console.log(b);
`,
		`
const {
	a: {
		b
	}
} = foo;
console.log(foo.a().b);
`,
		`
function bar() {
	const {a} = foo;
}
function baz() {
	console.log(foo.b);
}
`,
		`
for (const foo of bar) {
	const {a} = foo;
}
console.log(foo.a);
`,
		`
const {a} = foo;
foo.a++;
`,
		`
const {a} = foo;
++foo.a;
`,
		`
const {a} = foo;
foo.a += 1;
`,
		`
const {a} = foo;
foo.a = 1;
`,
		`
const c = 123;
const {a} = foo;
const {b} = foo;
console.log(foo.c);
`,
		`
const {a} = foo;
const b = 'bar';
console.log(foo.b);
`,
		`
const {a: b} = foo;
console.log(foo.b);
`,
		`
const {a} = foo;
console.log(foo['a']);
`,
		`
const {a} = foo;
const key = 'a';
console.log(foo[key]);
`,
		`
const key = 'a';
const {[key]: value} = foo;
console.log(foo.a);
`,
	],
});
