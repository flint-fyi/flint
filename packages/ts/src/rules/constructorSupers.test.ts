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
	],
});
