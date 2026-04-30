import rule from "./constructorSupers.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
class Child extends Parent {
    constructor() {
    }
}
`,
			snapshot: `
class Child extends Parent {
    constructor() {
    ~~~~~~~~~~~
    Constructors of derived classes must call \`super()\` before using \`this\` or returning.
    }
}
`,
		},
		{
			code: `
class Child extends Parent {
    constructor() {
        this.value = 1;
    }
}
`,
			snapshot: `
class Child extends Parent {
    constructor() {
    ~~~~~~~~~~~
    Constructors of derived classes must call \`super()\` before using \`this\` or returning.
        this.value = 1;
    }
}
`,
		},
		{
			code: `
class Child extends Parent {
    constructor(value: number) {
        this.value = value;
        return;
    }
}
`,
			snapshot: `
class Child extends Parent {
    constructor(value: number) {
    ~~~~~~~~~~~
    Constructors of derived classes must call \`super()\` before using \`this\` or returning.
        this.value = value;
        return;
    }
}
`,
		},
		{
			code: `
class Example {
    constructor() {
        super();
    }
}
`,
			snapshot: `
class Example {
    constructor() {
        super();
        ~~~~~~~
        Constructors of non-derived classes must not call \`super()\`.
    }
}
`,
		},
		{
			code: `
class Example {
    constructor(value: number) {
        super(value);
        this.value = value;
    }
}
`,
			snapshot: `
class Example {
    constructor(value: number) {
        super(value);
        ~~~~~~~~~~~~
        Constructors of non-derived classes must not call \`super()\`.
        this.value = value;
    }
}
`,
		},
		{
			code: `
const Example = class extends Parent {
    constructor() {
        console.log("created");
    }
};
`,
			snapshot: `
const Example = class extends Parent {
    constructor() {
    ~~~~~~~~~~~
    Constructors of derived classes must call \`super()\` before using \`this\` or returning.
        console.log("created");
    }
};
`,
		},
		{
			code: `
const Example = class {
    constructor() {
        super();
    }
};
`,
			snapshot: `
const Example = class {
    constructor() {
        super();
        ~~~~~~~
        Constructors of non-derived classes must not call \`super()\`.
    }
};
`,
		},
		{
			code: `
class A extends B {
    constructor() {
        var c = () => super();
    }
}
`,
			snapshot: `
class A extends B {
    constructor() {
    ~~~~~~~~~~~
    Constructors of derived classes must call \`super()\` before using \`this\` or returning.
        var c = () => super();
    }
}
`,
		},
		{
			code: `
class A extends B {
    constructor() {
        var c = class extends D { constructor() { super(); } }
    }
}
`,
			snapshot: `
class A extends B {
    constructor() {
    ~~~~~~~~~~~
    Constructors of derived classes must call \`super()\` before using \`this\` or returning.
        var c = class extends D { constructor() { super(); } }
    }
}
`,
		},
		{
			code: `
class A extends B {
    constructor() {
        class C extends D { constructor() { super(); } }
    }
}
`,
			snapshot: `
class A extends B {
    constructor() {
    ~~~~~~~~~~~
    Constructors of derived classes must call \`super()\` before using \`this\` or returning.
        class C extends D { constructor() { super(); } }
    }
}
`,
		},
		{
			code: `
class A extends B {
    constructor() {
        super();
        class C extends D { constructor() { } }
    }
}
`,
			snapshot: `
class A extends B {
    constructor() {
        super();
        class C extends D { constructor() { } }
                            ~~~~~~~~~~~
                            Constructors of derived classes must call \`super()\` before using \`this\` or returning.
    }
}
`,
		},
		{
			code: `
class A extends B {
    constructor() {
        for (var a of b) super.foo();
    }
}
`,
			snapshot: `
class A extends B {
    constructor() {
    ~~~~~~~~~~~
    Constructors of derived classes must call \`super()\` before using \`this\` or returning.
        for (var a of b) super.foo();
    }
}
`,
		},
		{
			code: `
class A extends B {
    constructor() {
        for (var i = 1; i < 10; i++) super.foo();
    }
}
`,
			snapshot: `
class A extends B {
    constructor() {
    ~~~~~~~~~~~
    Constructors of derived classes must call \`super()\` before using \`this\` or returning.
        for (var i = 1; i < 10; i++) super.foo();
    }
}
`,
		},
		{
			code: `
class C extends D {
    constructor() {
        do {
            something();
        } while (foo);
    }
}
`,
			snapshot: `
class C extends D {
    constructor() {
    ~~~~~~~~~~~
    Constructors of derived classes must call \`super()\` before using \`this\` or returning.
        do {
            something();
        } while (foo);
    }
}
`,
		},
		{
			code: `
class C extends D {
    constructor() {
        for (let i = 1;;i++) {
            if (bar) {
                break;
            }
        }
    }
}
`,
			snapshot: `
class C extends D {
    constructor() {
    ~~~~~~~~~~~
    Constructors of derived classes must call \`super()\` before using \`this\` or returning.
        for (let i = 1;;i++) {
            if (bar) {
                break;
            }
        }
    }
}
`,
		},
		{
			code: `
class Foo extends Bar {
    constructor() {
        for (a in b) for (c in d);
    }
}
`,
			snapshot: `
class Foo extends Bar {
    constructor() {
    ~~~~~~~~~~~
    Constructors of derived classes must call \`super()\` before using \`this\` or returning.
        for (a in b) for (c in d);
    }
}
`,
		},
	],
	valid: [
		`class Child extends Parent { constructor() { super(); } }`,
		`class Child extends Parent { constructor(value: number) { super(value); this.value = value; } }`,
		`class Example { constructor() { this.value = 1; } }`,
		`class Example { constructor(value: number) { this.value = value; } }`,
		`class Example { }`,
		`class Child extends Parent { }`,
		`class Child extends Parent { constructor() { super(); this.init(); } }`,
		`class Child extends Parent { method() { return 42; } }`,
		`class Example { method() { class Inner extends Parent { constructor() { super(); } } } }`,
		`class Example { constructor() { const fn = function() { }; } }`,
		`class A { constructor() { class B extends C { constructor() { super(); } } } }`,
		`class A extends B { constructor() { super(); class C extends D { constructor() { super(); } } } }`,
		`class A extends B { constructor() { super(); class C { constructor() { } } } }`,
		`class A extends B { constructor() { a ? super() : super(); } }`,
		`class A extends B { constructor() { if (a) super(); else super(); } }`,
		`class A extends B { constructor() { switch (a) { case 0: super(); break; default: super(); } } }`,
		`class A extends B { constructor() { try {} finally { super(); } } }`,
		`class A extends B { constructor() { if (a) throw Error(); super(); } }`,
		`class A extends (class B {}) { constructor() { super(); } }`,
		`class A extends (B = C) { constructor() { super(); } }`,
		`class A extends (B || C) { constructor() { super(); } }`,
		`class A extends (a ? B : C) { constructor() { super(); } }`,
		`class A extends (B, C) { constructor() { super(); } }`,
		`class A extends Object { constructor() { super(); for (let i = 0; i < 0; i++); } }`,
		`class A extends B { constructor(a) { super(); for (const b of a) { this.a(); } } }`,
		`class A extends B { constructor(a) { super(); for (b in a) { foo(b); } } }`,
		`class A extends obj?.prop { constructor() { super(); } }`,
	],
});
