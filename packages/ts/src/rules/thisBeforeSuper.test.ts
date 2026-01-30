import { ruleTester } from "./ruleTester.ts";
import rule from "./thisBeforeSuper.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
class Child extends Parent {
    constructor() {
        this.value = 0;
        super();
    }
}
`,
			snapshot: `
class Child extends Parent {
    constructor() {
        this.value = 0;
        ~~~~
        \`this\` is not allowed before \`super()\` in derived class constructors.
        super();
    }
}
`,
		},
		{
			code: `
class Child extends Parent {
    constructor() {
        this.init();
        super();
    }
}
`,
			snapshot: `
class Child extends Parent {
    constructor() {
        this.init();
        ~~~~
        \`this\` is not allowed before \`super()\` in derived class constructors.
        super();
    }
}
`,
		},
		{
			code: `
class Child extends Parent {
    constructor() {
        super.method();
        super();
    }
}
`,
			snapshot: `
class Child extends Parent {
    constructor() {
        super.method();
        ~~~~~
        \`super\` property access is not allowed before \`super()\` in derived class constructors.
        super();
    }
}
`,
		},
		{
			code: `
class Child extends Parent {
    constructor() {
        console.log(this);
        super();
    }
}
`,
			snapshot: `
class Child extends Parent {
    constructor() {
        console.log(this);
                    ~~~~
                    \`this\` is not allowed before \`super()\` in derived class constructors.
        super();
    }
}
`,
		},
		{
			code: `
class A extends B { constructor() { this.c = 0; } }
`,
			snapshot: `
class A extends B { constructor() { this.c = 0; } }
                                    ~~~~
                                    \`this\` is not allowed before \`super()\` in derived class constructors.
`,
		},
		{
			code: `
class A extends B { constructor() { this.c(); } }
`,
			snapshot: `
class A extends B { constructor() { this.c(); } }
                                    ~~~~
                                    \`this\` is not allowed before \`super()\` in derived class constructors.
`,
		},
		{
			code: `
class A extends B { constructor() { super.c(); } }
`,
			snapshot: `
class A extends B { constructor() { super.c(); } }
                                    ~~~~~
                                    \`super\` property access is not allowed before \`super()\` in derived class constructors.
`,
		},
		{
			code: `
class A extends B { constructor() { super(this.c); } }
`,
			snapshot: `
class A extends B { constructor() { super(this.c); } }
                                          ~~~~
                                          \`this\` is not allowed before \`super()\` in derived class constructors.
`,
		},
		{
			code: `
class A extends B { constructor() { super(this.c()); } }
`,
			snapshot: `
class A extends B { constructor() { super(this.c()); } }
                                          ~~~~
                                          \`this\` is not allowed before \`super()\` in derived class constructors.
`,
		},
		{
			code: `
class A extends B { constructor() { super(super.c()); } }
`,
			snapshot: `
class A extends B { constructor() { super(super.c()); } }
                                          ~~~~~
                                          \`super\` property access is not allowed before \`super()\` in derived class constructors.
`,
		},
		{
			code: `
class A extends B { constructor() { class C extends D { constructor() { super(); this.e(); } } this.f(); super(); } }
`,
			snapshot: `
class A extends B { constructor() { class C extends D { constructor() { super(); this.e(); } } this.f(); super(); } }
                                                                                               ~~~~
                                                                                               \`this\` is not allowed before \`super()\` in derived class constructors.
`,
		},
		{
			code: `
class A extends B { constructor() { class C extends D { constructor() { this.e(); super(); } } super(); this.f(); } }
`,
			snapshot: `
class A extends B { constructor() { class C extends D { constructor() { this.e(); super(); } } super(); this.f(); } }
                                                                        ~~~~
                                                                        \`this\` is not allowed before \`super()\` in derived class constructors.
`,
		},
		{
			code: `
class A extends B {
    constructor() {
        this.a = 1;
        this.b = 2;
        super();
    }
}
`,
			snapshot: `
class A extends B {
    constructor() {
        this.a = 1;
        ~~~~
        \`this\` is not allowed before \`super()\` in derived class constructors.
        this.b = 2;
        ~~~~
        \`this\` is not allowed before \`super()\` in derived class constructors.
        super();
    }
}
`,
		},
	],
	valid: [
		`class A { }`,
		`class A { constructor() { } }`,
		`class A { constructor() { this.b = 0; } }`,
		`class A { constructor() { this.b(); } }`,
		`class A extends null { }`,
		`class A extends null { constructor() { } }`,
		`class A extends B { }`,
		`class A extends B { constructor() { super(); } }`,
		`class A extends B { constructor() { super(); this.c = this.d; } }`,
		`class A extends B { constructor() { super(); this.c(); } }`,
		`class A extends B { constructor() { super(); super.c(); } }`,
		`class A extends B { constructor() { class C extends D { constructor() { super(); this.d = 0; } } super(); } }`,
		`class A extends B { constructor() { var B = class extends C { constructor() { super(); this.d = 0; } }; super(); } }`,
		`class A extends B { constructor() { function c() { this.d(); } super(); } }`,
		`class A extends B { constructor() { var c = function c() { this.d(); }; super(); } }`,
		`class A extends B { constructor() { var c = () => this.d(); super(); } }`,
		`class A { b() { this.c = 0; } }`,
		`class A extends B { c() { this.d = 0; } }`,
		`class C { field = this.toString(); }`,
		`class C extends B { field = this.foo(); }`,
		`class C extends B { field = this.foo(); constructor() { super(); } }`,
	],
});
