import rule from "./classFieldDeclarations.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
class Example {
    constructor() {
        this.value = 'hello';
    }
}
`,
			snapshot: `
class Example {
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
    constructor() {
        this.count = 42;
    }
}
`,
			snapshot: `
class Example {
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
    constructor() {
        this.enabled = true;
    }
}
`,
			snapshot: `
class Example {
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
    constructor() {
        this.disabled = false;
    }
}
`,
			snapshot: `
class Example {
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
    constructor() {
        this.data = null;
    }
}
`,
			snapshot: `
class Example {
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
    constructor() {
        this.negative = -1;
    }
}
`,
			snapshot: `
class Example {
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
		`class Example { constructor() { this.value = getValue(); } }`,
		`class Example { constructor() { this.value = param; } }`,
		`class Example { constructor(value) { this.value = value; } }`,
		`class Example { constructor() { this.value = this.compute(); } }`,
		`class Example { constructor() { const value = 'hello'; } }`,
		`class Example { constructor() { value = 'hello'; } }`,
		`class Example { constructor() { other.value = 'hello'; } }`,
		`class Example { constructor() { this.value += 1; } }`,
		`class Example { constructor() { this.items = []; } }`,
		`class Example { constructor() { this.config = {}; } }`,
		`class Example { constructor() { this.fn = () => {}; } }`,
	],
});
