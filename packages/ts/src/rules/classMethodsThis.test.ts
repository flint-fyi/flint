import rule from "./classMethodsThis.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
class Example {
    method() {
        return 42;
    }
}
`,
			snapshot: `
class Example {
    method() {
    ~~~~~~
    Expected 'this' to be used by class method 'method'.
        return 42;
    }
}
`,
		},
		{
			code: `
class Example {
    get value() {
        return 42;
    }
}
`,
			snapshot: `
class Example {
    get value() {
    ~~~~~~~~~
    Expected 'this' to be used by class getter 'value'.
        return 42;
    }
}
`,
		},
		{
			code: `
class Example {
    set value(newValue: number) {
        console.log(newValue);
    }
}
`,
			snapshot: `
class Example {
    set value(newValue: number) {
    ~~~~~~~~~
    Expected 'this' to be used by class setter 'value'.
        console.log(newValue);
    }
}
`,
		},
		{
			code: `
class Example {
    handler = () => {
        return 42;
    };
}
`,
			snapshot: `
class Example {
    handler = () => {
    ~~~~~~~
    Expected 'this' to be used by class method 'handler'.
        return 42;
    };
}
`,
		},
		{
			code: `
class Example {
    handler = function() {
        return 42;
    };
}
`,
			snapshot: `
class Example {
    handler = function() {
    ~~~~~~~
    Expected 'this' to be used by class method 'handler'.
        return 42;
    };
}
`,
		},
		{
			code: `
class Example {
    private helper() {
        return Math.random();
    }
}
`,
			snapshot: `
class Example {
    private helper() {
            ~~~~~~
            Expected 'this' to be used by class method 'helper'.
        return Math.random();
    }
}
`,
		},
		{
			code: `
class Example {
    protected compute() {
        return 1 + 2;
    }
}
`,
			snapshot: `
class Example {
    protected compute() {
              ~~~~~~~
              Expected 'this' to be used by class method 'compute'.
        return 1 + 2;
    }
}
`,
		},
		{
			code: `
class Example {
    async fetchData() {
        return await fetch("/api");
    }
}
`,
			snapshot: `
class Example {
    async fetchData() {
          ~~~~~~~~~
          Expected 'this' to be used by class method 'fetchData'.
        return await fetch("/api");
    }
}
`,
		},
		{
			code: `
class Example {
    ["computed"]() {
        return 42;
    }
}
`,
			snapshot: `
class Example {
    ["computed"]() {
    ~~~~~~~~~~~~
    Expected 'this' to be used by class method 'computed'.
        return 42;
    }
}
`,
		},
		{
			code: `
class Example {
    #privateMethod() {
        return 42;
    }
}
`,
			snapshot: `
class Example {
    #privateMethod() {
    ~~~~~~~~~~~~~~
    Expected 'this' to be used by class method '#privateMethod'.
        return 42;
    }
}
`,
		},
		{
			code: `
class Example {
    get #privateGetter() {
        return 42;
    }
}
`,
			snapshot: `
class Example {
    get #privateGetter() {
    ~~~~~~~~~~~~~~~~~~
    Expected 'this' to be used by class getter '#privateGetter'.
        return 42;
    }
}
`,
		},
		{
			code: `
class Example {
    set #privateSetter(value: number) {
        console.log(value);
    }
}
`,
			snapshot: `
class Example {
    set #privateSetter(value: number) {
    ~~~~~~~~~~~~~~~~~~
    Expected 'this' to be used by class setter '#privateSetter'.
        console.log(value);
    }
}
`,
		},
		{
			code: `
class Example {
    #handler = () => {
        return 42;
    };
}
`,
			snapshot: `
class Example {
    #handler = () => {
    ~~~~~~~~
    Expected 'this' to be used by class method '#handler'.
        return 42;
    };
}
`,
		},
		{
			code: `
const Example = class {
    method() {
        return 42;
    }
};
`,
			snapshot: `
const Example = class {
    method() {
    ~~~~~~
    Expected 'this' to be used by class method 'method'.
        return 42;
    }
};
`,
		},
		{
			code: `
class Example {
    method() {
        const inner = function() {
            return this.value;
        };
        return inner();
    }
}
`,
			snapshot: `
class Example {
    method() {
    ~~~~~~
    Expected 'this' to be used by class method 'method'.
        const inner = function() {
            return this.value;
        };
        return inner();
    }
}
`,
		},
		{
			code: `
class Example {
    method() {
        class Inner {
            getValue() {
                return this.value;
            }
        }
        return new Inner();
    }
}
`,
			snapshot: `
class Example {
    method() {
    ~~~~~~
    Expected 'this' to be used by class method 'method'.
        class Inner {
            getValue() {
                return this.value;
            }
        }
        return new Inner();
    }
}
`,
		},
		{
			code: `
class Example {
    method() {
        return class { foo = this };
    }
}
`,
			snapshot: `
class Example {
    method() {
    ~~~~~~
    Expected 'this' to be used by class method 'method'.
        return class { foo = this };
    }
}
`,
		},
		{
			code: `
class Example {
    method() {
        return class { static { this; } };
    }
}
`,
			snapshot: `
class Example {
    method() {
    ~~~~~~
    Expected 'this' to be used by class method 'method'.
        return class { static { this; } };
    }
}
`,
		},
		{
			code: `
class Example {
    *generator() {
        yield 1;
        yield 2;
    }
}
`,
			snapshot: `
class Example {
    *generator() {
     ~~~~~~~~~
     Expected 'this' to be used by class method 'generator'.
        yield 1;
        yield 2;
    }
}
`,
		},
		{
			code: `
class Example {
    foo() {}
    'bar'() {}
    123() {}
    get quux() {}
    set baz(v: number) {}
    *gen() {}
}
`,
			snapshot: `
class Example {
    foo() {}
    ~~~
    Expected 'this' to be used by class method 'foo'.
    'bar'() {}
    ~~~~~
    Expected 'this' to be used by class method 'bar'.
    123() {}
    ~~~
    Expected 'this' to be used by class method '123'.
    get quux() {}
    ~~~~~~~~
    Expected 'this' to be used by class getter 'quux'.
    set baz(v: number) {}
    ~~~~~~~
    Expected 'this' to be used by class setter 'baz'.
    *gen() {}
     ~~~
     Expected 'this' to be used by class method 'gen'.
}
`,
		},
		{
			code: `
class Example {
    [\`template\`]() {
        return 42;
    }
}
`,
			snapshot: `
class Example {
    [\`template\`]() {
    ~~~~~~~~~~~~
    Expected 'this' to be used by class method 'template'.
        return 42;
    }
}
`,
		},
		{
			code: `
class Example {
    method() {
        const arrow = () => undefined;
        return arrow();
    }
}
`,
			snapshot: `
class Example {
    method() {
    ~~~~~~
    Expected 'this' to be used by class method 'method'.
        const arrow = () => undefined;
        return arrow();
    }
}
`,
		},
		{
			code: `
class Derived extends Base {
    override method() {
        return 42;
    }
}
`,
			snapshot: `
class Derived extends Base {
    override method() {
             ~~~~~~
             Expected 'this' to be used by class method 'method'.
        return 42;
    }
}
`,
		},
		{
			code: `
class Derived extends Base {
    override get value() {
        return 42;
    }
}
`,
			snapshot: `
class Derived extends Base {
    override get value() {
    ~~~~~~~~~~~~~~~~~~
    Expected 'this' to be used by class getter 'value'.
        return 42;
    }
}
`,
		},
		{
			code: `
class Derived extends Base {
    override set value(v: number) {
        console.log(v);
    }
}
`,
			snapshot: `
class Derived extends Base {
    override set value(v: number) {
    ~~~~~~~~~~~~~~~~~~
    Expected 'this' to be used by class setter 'value'.
        console.log(v);
    }
}
`,
		},
		{
			code: `
class Derived extends Base {
    override handler = () => {};
}
`,
			snapshot: `
class Derived extends Base {
    override handler = () => {};
             ~~~~~~~
             Expected 'this' to be used by class method 'handler'.
}
`,
		},
		{
			code: `
interface Handler { handle(): void; }
class Example implements Handler {
    handle() {
        return 42;
    }
}
`,
			snapshot: `
interface Handler { handle(): void; }
class Example implements Handler {
    handle() {
    ~~~~~~
    Expected 'this' to be used by class method 'handle'.
        return 42;
    }
}
`,
		},
		{
			code: `
interface Handler { handle(): void; }
class Example implements Handler {
    handle() {}
    private helper() {}
    protected compute() {}
    #privateMethod() {}
}
`,
			options: { ignoreClassesThatImplementAnInterface: "public-fields" },
			snapshot: `
interface Handler { handle(): void; }
class Example implements Handler {
    handle() {}
    private helper() {}
            ~~~~~~
            Expected 'this' to be used by class method 'helper'.
    protected compute() {}
              ~~~~~~~
              Expected 'this' to be used by class method 'compute'.
    #privateMethod() {}
    ~~~~~~~~~~~~~~
    Expected 'this' to be used by class method '#privateMethod'.
}
`,
		},
		{
			code: `
interface Handler { handle(): void; }
class Example implements Handler {
    handle() {}
    private get value() { return 1; }
    protected set other(v: number) {}
    get #privateGetter() { return 1; }
}
`,
			options: { ignoreClassesThatImplementAnInterface: "public-fields" },
			snapshot: `
interface Handler { handle(): void; }
class Example implements Handler {
    handle() {}
    private get value() { return 1; }
    ~~~~~~~~~~~~~~~~~
    Expected 'this' to be used by class getter 'value'.
    protected set other(v: number) {}
    ~~~~~~~~~~~~~~~~~~~
    Expected 'this' to be used by class setter 'other'.
    get #privateGetter() { return 1; }
    ~~~~~~~~~~~~~~~~~~
    Expected 'this' to be used by class getter '#privateGetter'.
}
`,
		},
		{
			code: `
interface Handler { handle(): void; }
class Example implements Handler {
    handle() {}
    private prop = () => {};
    protected other = () => {};
    #privateProp = () => {};
}
`,
			options: { ignoreClassesThatImplementAnInterface: "public-fields" },
			snapshot: `
interface Handler { handle(): void; }
class Example implements Handler {
    handle() {}
    private prop = () => {};
            ~~~~
            Expected 'this' to be used by class method 'prop'.
    protected other = () => {};
              ~~~~~
              Expected 'this' to be used by class method 'other'.
    #privateProp = () => {};
    ~~~~~~~~~~~~
    Expected 'this' to be used by class method '#privateProp'.
}
`,
		},
		{
			code: `
class Example {
    method() {
        return 42;
    }
}
`,
			options: { ignoreClassesThatImplementAnInterface: true },
			snapshot: `
class Example {
    method() {
    ~~~~~~
    Expected 'this' to be used by class method 'method'.
        return 42;
    }
}
`,
		},
		{
			code: `
class Example {
    method() { /* this */ }
}
`,
			snapshot: `
class Example {
    method() { /* this */ }
    ~~~~~~
    Expected 'this' to be used by class method 'method'.
}
`,
		},
		{
			code: `
class Example {
    foo() { window.this; }
    bar() { that.this = 'this'; }
}
`,
			snapshot: `
class Example {
    foo() { window.this; }
    ~~~
    Expected 'this' to be used by class method 'foo'.
    bar() { that.this = 'this'; }
    ~~~
    Expected 'this' to be used by class method 'bar'.
}
`,
		},
	],
	valid: [
		`class Example { method() { return this.value; } }`,
		`class Example { method() { this.doSomething(); } }`,
		`class Example { method() { bar(this); } }`,
		`class Example { method() { if(true) { return this; } } }`,
		`class Example { get value() { return this._value; } }`,
		`class Example { set value(v: number) { this._value = v; } }`,
		`class Example { handler = () => { return this.value; }; }`,
		`class Example { handler = () => { super.toString; }; }`,
		`class Example { handler = function() { this; }; }`,
		`class Example { static method() { return 42; } }`,
		`class Example { static get value() { return 42; } }`,
		`class Example { static set value(v: number) { console.log(v); } }`,
		`class Example { static handler = () => { return 42; }; }`,
		`class Example { static handler = function() { return 42; }; }`,
		`class Example { static {} }`,
		`class Example { constructor() { console.log("init"); } }`,
		`abstract class Example { abstract method(): void; }`,
		`class Example { declare method: () => void; }`,
		`class Example { private _value = 0; readonly count = 5; }`,
		`class Example { method() { return this?.value; } }`,
		`class Example { method() { return super.method(); } }`,
		`class Example { method() { const arrow = () => this.value; return arrow(); } }`,
		`class Example { method() { return () => this; } }`,
		`({ a(){} });`,
		`({ a: function () {} });`,
		`class A { foo() { return class { [this.foo] = 1 }; } }`,

		{
			code: `class Derived extends Base { override method() { return 42; } }`,
			options: { ignoreOverrideMethods: true },
		},
		{
			code: `class Derived extends Base { override get value() { return 42; } }`,
			options: { ignoreOverrideMethods: true },
		},
		{
			code: `class Derived extends Base { override set value(v: number) { console.log(v); } }`,
			options: { ignoreOverrideMethods: true },
		},
		{
			code: `class Derived extends Base { override handler = () => {}; }`,
			options: { ignoreOverrideMethods: true },
		},
		{
			code: `class Derived extends Base { private override method() {} }`,
			options: { ignoreOverrideMethods: true },
		},
		{
			code: `class Derived extends Base { protected override method() {} }`,
			options: { ignoreOverrideMethods: true },
		},
		{
			code: `interface Handler { handle(): void; } class Example implements Handler { handle() { return 42; } }`,
			options: { ignoreClassesThatImplementAnInterface: true },
		},
		{
			code: `interface Handler { handle(): void; } class Example implements Handler { get value() { return 42; } }`,
			options: { ignoreClassesThatImplementAnInterface: true },
		},
		{
			code: `interface Handler { handle(): void; } class Example implements Handler { set value(v: number) {} }`,
			options: { ignoreClassesThatImplementAnInterface: true },
		},
		{
			code: `interface Handler { handle(): void; } class Example implements Handler { handler = () => {}; }`,
			options: { ignoreClassesThatImplementAnInterface: true },
		},
		{
			code: `interface Handler { handle(): void; } class Example implements Handler { private method() {} }`,
			options: { ignoreClassesThatImplementAnInterface: true },
		},
		{
			code: `interface Handler { handle(): void; } class Example implements Handler { handle() { return 42; } }`,
			options: { ignoreClassesThatImplementAnInterface: "public-fields" },
		},
		{
			code: `interface Handler { handle(): void; } class Example implements Handler { get value() { return 42; } }`,
			options: { ignoreClassesThatImplementAnInterface: "public-fields" },
		},
		{
			code: `interface Handler { handle(): void; } class Example implements Handler { public method() {} }`,
			options: { ignoreClassesThatImplementAnInterface: "public-fields" },
		},
		{
			code: `interface Handler { handle(): void; } class Example implements Handler { override method() {} }`,
			options: {
				ignoreClassesThatImplementAnInterface: true,
				ignoreOverrideMethods: true,
			},
		},
		{
			code: `interface Handler { handle(): void; } class Example implements Handler { private override method() {} }`,
			options: {
				ignoreClassesThatImplementAnInterface: "public-fields",
				ignoreOverrideMethods: true,
			},
		},
		`class Example { *generator() { yield this.value; } }`,
		`class Example { async fetch() { return await this.getData(); } }`,
	],
});
