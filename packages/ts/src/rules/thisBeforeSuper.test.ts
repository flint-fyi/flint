import rule from "./thisBeforeSuper.ts";
import { ruleTester } from "./ruleTester.ts";

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
	],
	valid: [
		`class Base { constructor() { this.value = 0; } }`,
		`class Child extends Parent { constructor() { super(); this.value = 0; } }`,
		`class Child extends Parent { constructor() { super(); super.init(); } }`,
		`class Child extends Parent { method() { this.value = 0; } }`,
		`class Child extends Parent { constructor() { super(); } }`,
		`class Child extends Parent { constructor() { const x = 1; super(); this.value = x; } }`,
	],
});
