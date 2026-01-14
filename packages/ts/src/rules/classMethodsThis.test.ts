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
    getValue() {
        return "hello";
    }
}
`,
			snapshot: `
class Example {
    getValue() {
    ~~~~~~~~
    Expected 'this' to be used by class method 'getValue'.
        return "hello";
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
    Expected 'this' to be used by class method '["computed"]'.
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
	],
	valid: [
		`class Example { method() { return this.value; } }`,
		`class Example { method() { this.doSomething(); } }`,
		`class Example { get value() { return this._value; } }`,
		`class Example { set value(v: number) { this._value = v; } }`,
		`class Example { handler = () => { return this.value; }; }`,
		`class Example { static method() { return 42; } }`,
		`class Example { static get value() { return 42; } }`,
		`class Example { static set value(v: number) { console.log(v); } }`,
		`class Example { static handler = () => { return 42; }; }`,
		`class Example { constructor() { console.log("init"); } }`,
		`class Derived extends Base { override method() { return 42; } }`,
		`class Derived extends Base { override get value() { return 42; } }`,
		`class Derived extends Base { override set value(v: number) { console.log(v); } }`,
		`interface Handler { handle(): void; } class Example implements Handler { handle() { return 42; } }`,
		`class Example { method() { return super.method(); } }`,
		`class Example { method() { const arrow = () => this.value; return arrow(); } }`,
		`abstract class Example { abstract method(): void; }`,
		`class Example { declare method: () => void; }`,
		`class Example { private _value = 0; readonly count = 5; }`,
		`class Example { method() { return this?.value; } }`,
	],
});
