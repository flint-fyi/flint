import rule from "./parameterPropertyAssignment.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
class Foo {
	constructor(public foo: string) {
		this.foo = foo;
	}
}
`,
			snapshot: `
class Foo {
	constructor(public foo: string) {
		this.foo = foo;
		~~~~~~~~~~~~~~
		This assignment is unnecessary since it is already assigned by a parameter property.
	}
}
`,
		},
		{
			code: `
class Foo {
	constructor(public foo?: string) {
		this.foo = foo!;
	}
}
`,
			snapshot: `
class Foo {
	constructor(public foo?: string) {
		this.foo = foo!;
		~~~~~~~~~~~~~~~
		This assignment is unnecessary since it is already assigned by a parameter property.
	}
}
`,
		},
		{
			code: `
class Foo {
	constructor(public foo?: string) {
		this.foo = foo as any;
	}
}
`,
			snapshot: `
class Foo {
	constructor(public foo?: string) {
		this.foo = foo as any;
		~~~~~~~~~~~~~~~~~~~~~
		This assignment is unnecessary since it is already assigned by a parameter property.
	}
}
`,
		},
		{
			code: `
class Foo {
	constructor(public foo = '') {
		this.foo = foo;
	}
}
`,
			snapshot: `
class Foo {
	constructor(public foo = '') {
		this.foo = foo;
		~~~~~~~~~~~~~~
		This assignment is unnecessary since it is already assigned by a parameter property.
	}
}
`,
		},
		{
			code: `
class Foo {
	constructor(public foo = '') {
		this.foo = foo;
		this.foo += 'foo';
	}
}
`,
			snapshot: `
class Foo {
	constructor(public foo = '') {
		this.foo = foo;
		~~~~~~~~~~~~~~
		This assignment is unnecessary since it is already assigned by a parameter property.
		this.foo += 'foo';
	}
}
`,
		},
		{
			code: `
class Foo {
	constructor(public foo: string) {
		this.foo ||= foo;
	}
}
`,
			snapshot: `
class Foo {
	constructor(public foo: string) {
		this.foo ||= foo;
		~~~~~~~~~~~~~~~~
		This assignment is unnecessary since it is already assigned by a parameter property.
	}
}
`,
		},
		{
			code: `
class Foo {
	constructor(public foo: string) {
		this.foo ??= foo;
	}
}
`,
			snapshot: `
class Foo {
	constructor(public foo: string) {
		this.foo ??= foo;
		~~~~~~~~~~~~~~~~
		This assignment is unnecessary since it is already assigned by a parameter property.
	}
}
`,
		},
		{
			code: `
class Foo {
	constructor(public foo: string) {
		this.foo &&= foo;
	}
}
`,
			snapshot: `
class Foo {
	constructor(public foo: string) {
		this.foo &&= foo;
		~~~~~~~~~~~~~~~~
		This assignment is unnecessary since it is already assigned by a parameter property.
	}
}
`,
		},
		{
			code: `
class Foo {
	constructor(private foo: string) {
		this['foo'] = foo;
	}
}
`,
			snapshot: `
class Foo {
	constructor(private foo: string) {
		this['foo'] = foo;
		~~~~~~~~~~~~~~~~~
		This assignment is unnecessary since it is already assigned by a parameter property.
	}
}
`,
		},
		{
			code: `
class Foo {
	constructor(private foo: string) {
		function bar() {
			this.foo = foo;
		}
		this.foo = foo;
	}
}
`,
			snapshot: `
class Foo {
	constructor(private foo: string) {
		function bar() {
			this.foo = foo;
		}
		this.foo = foo;
		~~~~~~~~~~~~~~
		This assignment is unnecessary since it is already assigned by a parameter property.
	}
}
`,
		},
		{
			code: `
class Foo {
	constructor(private foo: string) {
		this.bar = () => {
			this.foo = foo;
		};
		this.foo = foo;
	}
}
`,
			snapshot: `
class Foo {
	constructor(private foo: string) {
		this.bar = () => {
			this.foo = foo;
		};
		this.foo = foo;
		~~~~~~~~~~~~~~
		This assignment is unnecessary since it is already assigned by a parameter property.
	}
}
`,
		},
		{
			code: `
class Foo {
	constructor(private foo: string) {
		class Bar {
			constructor(private foo: string) {
				this.foo = foo;
			}
		}
		this.foo = foo;
	}
}
`,
			snapshot: `
class Foo {
	constructor(private foo: string) {
		class Bar {
			constructor(private foo: string) {
				this.foo = foo;
				~~~~~~~~~~~~~~
				This assignment is unnecessary since it is already assigned by a parameter property.
			}
		}
		this.foo = foo;
		~~~~~~~~~~~~~~
		This assignment is unnecessary since it is already assigned by a parameter property.
	}
}
`,
		},
		{
			code: `
class Foo {
	constructor(private foo: string) {
		{
			this.foo = foo;
		}
	}
}
`,
			snapshot: `
class Foo {
	constructor(private foo: string) {
		{
			this.foo = foo;
			~~~~~~~~~~~~~~
			This assignment is unnecessary since it is already assigned by a parameter property.
		}
	}
}
`,
		},
		{
			code: `
class Foo {
	constructor(private foo: string) {
		(() => {
			this.foo = foo;
		})();
	}
}
`,
			snapshot: `
class Foo {
	constructor(private foo: string) {
		(() => {
			this.foo = foo;
			~~~~~~~~~~~~~~
			This assignment is unnecessary since it is already assigned by a parameter property.
		})();
	}
}
`,
		},
	],
	valid: [
		`
class Foo {
	constructor(foo: string) {}
}
`,
		`
class Foo {
	constructor(private foo: string) {}
}
`,
		`
class Foo {
	constructor(private foo: string) {
		this.foo = bar;
	}
}
`,
		`
class Foo {
	constructor(private foo: any) {
		this.foo = foo.bar;
	}
}
`,
		`
class Foo {
	constructor(private foo: string) {
		this.foo = this.bar;
	}
}
`,
		`
class Foo {
	foo: string;
	constructor(foo: string) {
		this.foo = foo;
	}
}
`,
		`
class Foo {
	bar: string;
	constructor(private foo: string) {
		this.bar = foo;
	}
}
`,
		`
class Foo {
	constructor(private foo: string) {
		this.bar = () => {
			this.foo = foo;
		};
	}
}
`,
		`
class Foo {
	constructor(private foo: string) {
		this[\`\${foo}\`] = foo;
	}
}
`,
		`
function Foo(foo) {
	this.foo = foo;
}
`,
		`
const foo = 'foo';
this.foo = foo;
`,
		`
class Foo {
	constructor(public foo: number) {
		this.foo += foo;
		this.foo -= foo;
		this.foo *= foo;
		this.foo /= foo;
		this.foo %= foo;
		this.foo **= foo;
	}
}
`,
		`
class Foo {
	constructor(public foo: number) {
		this.foo += 1;
		this.foo = foo;
	}
}
`,

		`
declare const name: string;
class Foo {
	constructor(public foo: number) {
		this[name] = foo;
	}
}
`,
		`
class MyClass {
	constructor(value: string) {
		this.value = value;
	}
}
`,
		`
class Service {
	update(data: object) {
		this.data = data;
	}
}
`,
		`
class MyClass {
	prop: string;
	constructor(value: string) {
		this.prop = value;
	}
}
`,
		`
function fn(x: number) {
	this.x = x;
}
`,
	],
});
