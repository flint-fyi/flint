import rule from "./classFieldDeclarations.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
class Example {
    value!: string;
    constructor() {
        this.value = 'hello';
    }
}
`,
			snapshot: `
class Example {
    value!: string;
    constructor() {
        this.value = 'hello';
        ~~~~~~~~~~~~~~~~~~~~~
        Prefer class field declaration over \`this\` assignment in constructor for static values.
    }
}
`,
		},
		{
			code: `
class Example {
    count!: number;
    constructor() {
        this.count = 42;
    }
}
`,
			snapshot: `
class Example {
    count!: number;
    constructor() {
        this.count = 42;
        ~~~~~~~~~~~~~~~~
        Prefer class field declaration over \`this\` assignment in constructor for static values.
    }
}
`,
		},
		{
			code: `
class Example {
    enabled!: boolean;
    constructor() {
        this.enabled = true;
    }
}
`,
			snapshot: `
class Example {
    enabled!: boolean;
    constructor() {
        this.enabled = true;
        ~~~~~~~~~~~~~~~~~~~~
        Prefer class field declaration over \`this\` assignment in constructor for static values.
    }
}
`,
		},
		{
			code: `
class Example {
    disabled!: boolean;
    constructor() {
        this.disabled = false;
    }
}
`,
			snapshot: `
class Example {
    disabled!: boolean;
    constructor() {
        this.disabled = false;
        ~~~~~~~~~~~~~~~~~~~~~~
        Prefer class field declaration over \`this\` assignment in constructor for static values.
    }
}
`,
		},
		{
			code: `
class Example {
    data!: null;
    constructor() {
        this.data = null;
    }
}
`,
			snapshot: `
class Example {
    data!: null;
    constructor() {
        this.data = null;
        ~~~~~~~~~~~~~~~~~
        Prefer class field declaration over \`this\` assignment in constructor for static values.
    }
}
`,
		},
		{
			code: `
class Example {
    negative!: number;
    constructor() {
        this.negative = -1;
    }
}
`,
			snapshot: `
class Example {
    negative!: number;
    constructor() {
        this.negative = -1;
        ~~~~~~~~~~~~~~~~~~~
        Prefer class field declaration over \`this\` assignment in constructor for static values.
    }
}
`,
		},
		{
			code: `
class MyError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'MyError';
    }
}
`,
			snapshot: `
class MyError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'MyError';
        ~~~~~~~~~~~~~~~~~~~~~~
        Prefer class field declaration over \`this\` assignment in constructor for static values.
    }
}
`,
		},
	],
	valid: [
		`class Example { value = 'hello'; }`,
		`
declare function getValue(): string;
class Example {
    value!: string;
    constructor() {
        this.value = getValue();
    }
}
`,
		`
declare const param: string;
class Example {
    value!: string;
    constructor() {
        this.value = param;
    }
}
`,
		`
class Example {
    value!: string;
    constructor(value: string) {
        this.value = value;
    }
}
`,
		`
class Example {
    value!: string;
    compute(): string {
        return "value";
    }
    constructor() {
        this.value = this.compute();
    }
}
`,
		`class Example { constructor() { const value = 'hello'; } }`,
		`
let value = "";
class Example {
    constructor() {
        value = 'hello';
    }
}
`,
		`
declare const other: { value: string };
class Example {
    constructor() {
        other.value = 'hello';
    }
}
`,
		`
class Example {
    value = 0;
    constructor() {
        this.value += 1;
    }
}
`,
		`
class Example {
    items: unknown[] = [];
    constructor() {
        this.items = [];
    }
}
`,
		`
class Example {
    config: object = {};
    constructor() {
        this.config = {};
    }
}
`,
		`
class Example {
    fn = () => {};
    constructor() {
        this.fn = () => {};
    }
}
`,
	],
});
